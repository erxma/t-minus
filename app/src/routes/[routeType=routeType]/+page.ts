import type { RouteResource, StopResource } from "@t-minus/shared";
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

    const route = routeOptions.find((r) => r.id === routeParam);
    // If route param is unset, or not an option
    if (!route) {
        // Redirect with route defaulted to first option
        let defaultRoute;
        if (routeType === "bus") {
            defaultRoute = "1";
        } else {
            defaultRoute = routeOptions[0].id;
        }

        const newURL = new URL(url);
        newURL.searchParams.set("route", defaultRoute);
        redirect(307, newURL);
    }

    let direction = Number(directionParam);
    // If direction is anything other than 0 or 1, default to 0
    if (direction !== 0 && direction !== 1) {
        direction = 0;
    }

    let pattern = route.route_patterns?.find(
        (pattern) =>
            pattern.id === patternParam && pattern.direction_id === direction,
    );
    // If route pattern param is unset, or not an option
    if (!pattern) {
        // Default to first option
        pattern = route.route_patterns!.find(
            (pattern) => pattern.direction_id === direction,
        )!;
    }

    const stops: Promise<StopResource[]> = fetch(
        `/api/trip-stops?trip=${pattern.representative_trip?.id}`,
    ).then((r) => r.json());

    return {
        routeOptions,
        route,
        direction,
        pattern,
        stops,
    };
};
