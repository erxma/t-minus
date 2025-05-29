import { apiClient } from "$lib/util/api-client.js";
import { RouteType, type RouteResource } from "@t-minus/shared";
import type { PageLoad } from "./$types";
import { redirect } from "@sveltejs/kit";
import { browser } from "$app/environment";

const ROUTE_OPTIONS_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export const load: PageLoad = async ({ url, fetch }) => {
    let routeOptions: RouteResource[];
    if (browser) {
        // Client-side: always fetch fresh
        routeOptions = await fetchRouteOptions(fetch);
    } else {
        // Server-side: use cache
        const { TTL_CACHE } = await import("$lib/util/cache");
        const cached = TTL_CACHE.get("route-options");
        if (cached) {
            routeOptions = cached as RouteResource[];
        } else {
            routeOptions = await fetchRouteOptions(fetch);
            TTL_CACHE.set("route-options", routeOptions, {
                ttl: ROUTE_OPTIONS_CACHE_TTL,
            });
        }
    }

    let routeParam = url.searchParams.get("route");
    let directionParam = url.searchParams.get("direction");
    let patternParam = url.searchParams.get("pattern");

    const initialRoute = routeOptions.find((r) => r.id === routeParam);
    // If route param is unset, or not an option
    if (!initialRoute) {
        // Redirect with route defaulted to first option
        const newURL = new URL(url);
        newURL.searchParams.set("route", routeOptions[0].id);
        redirect(307, newURL);
    }

    let initialDirection = Number(directionParam);
    // If direction is anything other than 0 or 1, default to 0
    if (initialDirection !== 0 && initialDirection !== 1) {
        initialDirection = 0;
    }

    let initialPattern = initialRoute.route_patterns?.find(
        (pattern) => pattern.id === patternParam,
    );
    // If route pattern param is unset, or not an option
    if (!initialPattern) {
        // Default to first option
        initialPattern = initialRoute.route_patterns![0];
    }

    const initialStops = await apiClient.fetch(
        "stops",
        {
            filters: {
                route: routeParam!,
                direction_id: initialDirection,
            },
            fields: {
                stop: ["name", "wheelchair_boarding"],
            },
        },
        fetch,
    );

    return {
        routeOptions,
        initialRoute,
        initialDirection,
        initialPattern,
        initialStops,
    };
};

async function fetchRouteOptions(
    fetch: typeof globalThis.fetch,
): Promise<RouteResource[]> {
    const routes = await apiClient.fetch(
        "routes",
        {
            filters: {
                type: [RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL],
            },
            fields: {
                route: [
                    "color",
                    "direction_destinations",
                    "direction_names",
                    "long_name",
                    "short-name",
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
                route: routes.map((r) => r.id),
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
    for (const route of routes) {
        route.route_patterns = routePatterns.filter(
            (p) => p.route?.id === route.id,
        );
    }

    return routes;
}
