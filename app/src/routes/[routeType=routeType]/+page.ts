import type { RouteResource } from "@t-minus/shared";
import { redirect } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url, fetch, params }) => {
    let { routeType } = params;

    let routeOptions: RouteResource[] = await fetch(
        `/api/route-options/${routeType}`,
    ).then((r) => r.json());

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

    const initialStops = await fetch(
        `/api/trip-stops?trip=${initialPattern.representative_trip?.id}`,
    ).then((r) => r.json());

    return {
        routeOptions,
        initialRoute,
        initialDirection,
        initialPattern,
        initialStops,
    };
};
