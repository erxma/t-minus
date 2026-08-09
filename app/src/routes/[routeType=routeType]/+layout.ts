import type { RouteResource } from "@t-minus/shared";
import type { LayoutLoad } from "./$types";

export const load: LayoutLoad = async ({ fetch, params }) => {
    let { routeType } = params;

    let routeOptions: RouteResource[] = await fetch(
        `/api/route-options/${routeType}`,
    ).then((r) => r.json());

    return {
        routeOptions,
    };
};
