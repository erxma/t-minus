import type { StopResource } from "@t-minus/shared";
import { error } from "@sveltejs/kit";
import type { PageLoad } from "./$types";

export const load: PageLoad = async ({ url, fetch, params, parent }) => {
    let { routeId } = params;

    let directionParam = url.searchParams.get("direction");
    let patternParam = url.searchParams.get("pattern");

    const { routeOptions } = await parent();

    const route = routeOptions.find((r) => r.id === routeId);
    if (!route) {
        error(404);
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
