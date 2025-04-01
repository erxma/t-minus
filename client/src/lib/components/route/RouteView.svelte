<script lang="ts">
    import RoutePatternSelect from "./RoutePatternSelect.svelte";
    import StopList from "./StopList.svelte";

    import { apiClient } from "@lib/components/api-client";
    import { RouteType } from "@t-minus/shared";
    import type { RouteResource, StopResource } from "@t-minus/shared";

    import { onMount } from "svelte";

    interface Props {
        selectedRoute?: RouteResource;
        selectedStop?: StopResource;
    }

    let { selectedRoute = $bindable(), selectedStop = $bindable() }: Props =
        $props();

    let selectedDirectionId: number = $state(0);

    let routeOptions: RouteResource[] | undefined = $state();

    onMount(async () => {
        routeOptions = (await apiClient.fetch("routes", {
            filters: {
                type: [RouteType.LIGHT_RAIL, RouteType.HEAVY_RAIL],
            },
        })) as RouteResource[];

        selectedRoute = routeOptions[0];
    });

    async function fetchRoute(
        routeId: string,
        directionId: number,
    ): Promise<StopResource[]> {
        const response = await apiClient.fetch("stops", {
            filters: {
                route: routeId,
                direction_id: directionId,
            },
            fields: {
                stop: ["name", "wheelchair_boarding"],
            },
        });

        return response;
    }
</script>

<div class="container">
    {#if routeOptions}
        <RoutePatternSelect
            {routeOptions}
            bind:selectedRoute={selectedRoute!}
            bind:selectedDirectionId
        />
        <div class="route-stop-select">
            <StopList
                route={selectedRoute!}
                stops={fetchRoute(selectedRoute!.id, selectedDirectionId)}
                bind:selectedStop
            />
        </div>
    {/if}
</div>

<style>
    .container {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 480px;
        width: 100%;
    }

    .route-stop-select {
        display: flex;
        flex-direction: column;
        width: 100%;
    }
</style>
