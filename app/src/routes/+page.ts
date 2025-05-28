import { apiClient } from "$lib/components/api-client.js";
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

    const initialRoute = routeOptions.find((r) => r.id === routeParam);
    let initialDirection = Number(directionParam);
    if (initialDirection !== 0 && initialDirection !== 1) {
        initialDirection = 0;
    }

    // If route param is unset, redirect with new params:
    if (!initialRoute) {
        const newURL = new URL(url);
        // If route is specified and present, keep it; otherwise default to first option
        newURL.searchParams.set("route", routeOptions[0].id);
        // Throw redirect
        redirect(307, newURL);
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
        initialStops,
    };
};

async function fetchRouteOptions(
    fetch: typeof globalThis.fetch,
): Promise<RouteResource[]> {
    return await apiClient.fetch(
        "routes",
        {
            filters: {
                type: [RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL],
            },
        },
        fetch,
    );
}
