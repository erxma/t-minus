<script lang="ts">
    import "./global.css";

    import StopInfo from "./lib/components/StopInfo.svelte";
    import { Drawer } from "vaul-svelte";
    import Header from "./lib/components/Header.svelte";
    import {
        RouteType,
        type PredictionResource,
        type RouteResource,
        type StopResource,
    } from "@t-minus/shared";
    import RouteView from "./lib/components/route/RouteView.svelte";
    import { apiClient } from "./lib/components/api-client";
    import dayjs from "dayjs";
    import { MbtaStreamedCollection } from "./lib/components/collections.svelte";

    let selectedRoute: RouteResource | undefined = $state();
    let selectedStop: StopResource | undefined = $state();
    // (Can't be $derived because relation with selectedStop is two-way)
    let drawerOpen: boolean = $state(false);

    // (Can't be $derived because collection itself needs to be watched for changes)
    let predictions: MbtaStreamedCollection<PredictionResource> | undefined =
        $state();

    function setSelectedStop(value?: StopResource) {
        // Set value
        selectedStop = value;
        // If selecting a stop, open the drawer and start listening for predictions
        if (selectedStop) {
            drawerOpen = true;
            predictions = getPredictions(selectedStop.id);
        }
    }

    function setDrawerOpen(value: boolean) {
        // Set value
        drawerOpen = value;
        // If closing drawer, deselect stop and stop listening for predictions
        if (!drawerOpen) {
            selectedStop = undefined;
            predictions?.close();
            predictions = undefined;
        }
    }

    function getPredictions(
        stopId: string,
    ): MbtaStreamedCollection<PredictionResource> {
        const eventSource = apiClient.listen("predictions", {
            sort: "time",
            page: {
                limit: 10,
            },
            fields: {
                prediction: [
                    "arrival_time",
                    "departure_time",
                    "status",
                    "stop_sequence",
                ],
            },
            filters: {
                stop: stopId,
                route_type: [RouteType.HEAVY_RAIL, RouteType.LIGHT_RAIL],
            },
            include: ["route", "vehicle", "trip"],
        });

        window.addEventListener("beforeunload", () => {
            eventSource.close();
        });

        const timeAscending = (a: PredictionResource, b: PredictionResource) =>
            dayjs(a.arrival_time ?? b.departure_time).diff(
                b.arrival_time ?? b.departure_time,
            );

        return new MbtaStreamedCollection(
            "prediction",
            eventSource,
            timeAscending,
        );
    }
</script>

<Header />
<main>
    <RouteView
        bind:selectedRoute
        bind:selectedStop={() => selectedStop, setSelectedStop}
    />
    <Drawer.Root
        shouldScaleBackground
        bind:open={() => drawerOpen, setDrawerOpen}
    >
        <Drawer.Portal>
            <Drawer.Overlay class="drawer-overlay-default" />
            <Drawer.Content class="drawer-content-default">
                <Drawer.Close class="drawer-close-default"
                    ><div class="drawer-handle"></div></Drawer.Close
                >
                {#if selectedStop}
                    <StopInfo
                        stop={selectedStop}
                        route={selectedRoute!}
                        predictions={predictions!.data}
                    />
                {/if}
            </Drawer.Content>
        </Drawer.Portal>
    </Drawer.Root>
</main>

<style>
    main {
        margin: 0 1em 32px 1em;
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .drawer-handle {
        border-radius: calc(infinity * 1px);
        border: none;
        background-color: var(--fg-primary);
        height: 8px;
        width: 48px;
        margin: 4px 0;
    }
</style>
