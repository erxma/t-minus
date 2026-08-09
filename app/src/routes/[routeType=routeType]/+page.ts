import type { PageLoad } from "./$types";

const PAGE_CONFIGS = {
    subway: { heading: "Subway", itemWidth: "300px" },
    bus: { heading: "Bus", itemWidth: "100px" },
    cr: { heading: "Commuter Rail", itemWidth: "400px" },
};

export const load: PageLoad = async ({ params }) => {
    let { routeType } = params;

    return {
        routeType,
        ...PAGE_CONFIGS[routeType],
    };
};
