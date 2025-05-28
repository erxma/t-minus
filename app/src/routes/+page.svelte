<script lang="ts">
    import "$lib/global.css";

    import Header from "$lib/components/Header.svelte";
    import Loading from "$lib/components/common/Loading.svelte";
    import RoutePatternSelect from "$lib/components/route/RoutePatternSelect.svelte";
    import StopList from "$lib/components/route/StopList.svelte";
    import StopInfo from "$lib/components/StopInfo.svelte";
    import { Drawer } from "vaul-svelte";
    import { fade } from "svelte/transition";

    import {
        fetchNextSchedules,
        RouteType,
        type PredictionResource,
        type RouteResource,
        type ScheduleResource,
        type StopResource,
    } from "@t-minus/shared";
    import { apiClient } from "$lib/components/api-client";
    import { MbtaStreamedCollection } from "$lib/components/collections.svelte";
    import dayjs from "dayjs";
    import { page } from "$app/state";
    import type { PageProps } from "./$types";
    import { replaceState } from "$app/navigation";

    let { data }: PageProps = $props();

    let selectedRoute: RouteResource = $state(data.initialRoute);
    let selectedDirectionId: number = $state(data.initialDirection);
    let routeStops: StopResource[] | Promise<StopResource[]> = $state(
        data.initialStops,
    );

    let selectedStop: StopResource | undefined = $state();
    // (Can't be $derived because relation with selectedStop is two-way)
    let drawerOpen: boolean = $state(false);

    // (Can't be $derived because collection itself needs to be watched for changes)
    let predictions: MbtaStreamedCollection<PredictionResource> | undefined =
        $state();
    let arrivals: Promise<
        | readonly Readonly<PredictionResource>[]
        | readonly Readonly<ScheduleResource>[]
        | undefined
    > = $derived(getStopArrivals());

    async function setSelectedRoute(value: RouteResource) {
        selectedRoute = value;
        routeStops = fetchRouteStops(selectedRoute.id, selectedDirectionId);

        const url = new URL(page.url);
        url.searchParams.set("route", value.id);
        replaceState(url, {});
    }

    function setSelectedStop(value?: StopResource) {
        // Set value
        selectedStop = value;
        // If selecting a stop, open the drawer and start listening for predictions
        if (selectedStop) {
            drawerOpen = true;
            predictions = streamPredictions(selectedStop.id);
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

    function streamPredictions(
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
                    "update_type",
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

    async function fetchRouteStops(
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

    async function getStopArrivals() {
        if (!selectedRoute || !selectedStop || !predictions?.data) {
            return undefined;
        }

        if (predictions.data.length > 0) {
            return predictions.data;
        } else {
            return await fetchNextSchedules(
                apiClient,
                selectedStop.id,
                dayjs(),
                selectedRoute.id,
            );
        }
    }
</script>

<svelte:head>
    <title>T-Minus</title>
    <script>
        // Initialize theme:
        // Look for existing stored theme preference
        var theme = localStorage.getItem("theme");
        // If none, default to media query result
        if (!theme) {
            theme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }

        // Toggle the dark class accordingly
        document.documentElement.classList.toggle("dark", theme === "dark");
        // Store the chosen theme
        localStorage.setItem("theme", theme);
    </script>
</svelte:head>

<Header />
<main>
    <div class="route-view" in:fade>
        <RoutePatternSelect
            routeOptions={data.routeOptions}
            bind:selectedRoute={() => selectedRoute, setSelectedRoute}
            bind:selectedDirectionId
        />
        {#await routeStops}
            <Loading />
        {:then stops}
            <div class="route-stop-select" in:fade>
                <StopList
                    route={selectedRoute}
                    {stops}
                    onSelectStop={setSelectedStop}
                />
            </div>
        {:catch}
            <p>Failed to get list of stops on route.</p>
        {/await}
    </div>

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
                <!-- If there's a selected stop (there should be when drawer is open) -->
                {#if selectedStop}
                    <!-- Get list of expected arrivals (a reactive Promise, see above) -->
                    {#await arrivals}
                        <!-- Before arrivals are available, show with none -->
                        <StopInfo stop={selectedStop} route={selectedRoute} />
                    {:then arrivals}
                        <!-- Show with the arrivals -->
                        <StopInfo
                            stop={selectedStop}
                            route={selectedRoute}
                            {arrivals}
                        />
                    {/await}
                {/if}
            </Drawer.Content>
        </Drawer.Portal>
    </Drawer.Root>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .route-view {
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

    .drawer-handle {
        border-radius: calc(infinity * 1px);
        border: none;
        background-color: var(--fg-primary);
        height: 8px;
        width: 48px;
        margin: 4px 0;
    }
</style>
