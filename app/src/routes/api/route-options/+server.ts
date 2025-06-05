import { apiClient } from "$lib/util/api-client";
import { TTL_CACHE } from "$lib/server/cache";
import type { RequestHandler } from "@sveltejs/kit";
import { RouteType } from "@t-minus/shared";

const CACHE_TTL_SECS = 3600; // 1 hour

export const GET: RequestHandler = async ({ fetch }) => {
    // Check cache
    const cacheKey = "route-options";
    const cached = TTL_CACHE.get(cacheKey);
    if (cached) {
        return new Response(JSON.stringify(cached), {
            headers: {
                "Content-Type": "application/json",
                "cache-control": `public, max-age=${TTL_CACHE.getRemainingTTL(cacheKey) / 1000}`,
            },
        });
    }

    const routeOptions = await apiClient.fetch(
        "routes",
        {
            filters: {
                type: [RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL],
            },
            fields: {
                route: [
                    "color",
                    "text_color",
                    "direction_destinations",
                    "direction_names",
                    "long_name",
                    "short_name",
                ],
            },
            include: ["route_patterns"],
        },
        fetch,
    );

    // Current JSON:API flattening doesn't recurse, to avoid include loops,
    // so fetch route patterns with representative trips separately here.
    // This happens to be a good opportunity to filter by canonical
    const routePatterns = await apiClient.fetch(
        "route_patterns",
        {
            filters: {
                route: routeOptions.map((r) => r.id),
                canonical: true,
            },
            fields: {
                route_pattern: ["direction_id", "name", "sort_order"],
            },
            include: ["representative_trip"],
        },
        fetch,
    );

    // TODO: Maybe add a JSON:API helper for something like this
    for (const route of routeOptions) {
        route.route_patterns = routePatterns.filter(
            (p) => p.route?.id === route.id,
        );
    }

    TTL_CACHE.set(cacheKey, routeOptions, {
        ttl: CACHE_TTL_SECS * 1000,
    });

    return new Response(JSON.stringify(routeOptions), {
        headers: {
            "Content-Type": "application/json",
            "cache-control": `public, max-age=${CACHE_TTL_SECS}`,
        },
    });
};
