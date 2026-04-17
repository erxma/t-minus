<script lang="ts">
    import "$lib/global.css";

    import {
        fetchNextSchedules,
        RouteType,
        type AlertResource,
        type PredictionResource,
        type RoutePatternResource,
        type RouteResource,
        type ScheduleResource,
        type StopResource,
    } from "@t-minus/shared";
    import { apiClient } from "$lib/util/api-client";
    import { MbtaStreamedCollection } from "$lib/util/collections.svelte";
    import dayjs from "dayjs";
    import { page } from "$app/state";
    import type { PageProps } from "./$types";
    import { goto } from "$app/navigation";
    import Loading from "$lib/components/common/Loading.svelte";
    import RoutePatternSelect from "$lib/components/route/RoutePatternSelect.svelte";
    import StopList from "$lib/components/route/StopList.svelte";
    import StopInfo from "$lib/components/StopInfo.svelte";
    import { Drawer } from "vaul-svelte";
    import { fade } from "svelte/transition";
    import { Milestone } from "@lucide/svelte";
    import { isLargeScreen } from "$lib/util/media.svelte";

    type Arrivals =
        | readonly Readonly<ScheduleResource>[]
        | readonly Readonly<PredictionResource>[];

    let { data }: PageProps = $props();

    let selectedStop: StopResource | undefined = $state();

    let predictions: MbtaStreamedCollection<PredictionResource> | undefined =
        $state();
    const arrivals: Promise<Arrivals> | undefined = $derived.by(() => {
        if (!predictions?.data) {
            return undefined;
        }

        if (predictions.data.length > 0) {
            return Promise.resolve(predictions.data);
        } else {
            return fetchStopSchedules(
                selectedStop?.parent_station?.id!,
                data.route.id,
            );
        }
    });

    let alerts: MbtaStreamedCollection<AlertResource> | undefined = $state();

    const predictionsFetchParams = $derived({
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
            stop: selectedStop?.parent_station?.id ?? selectedStop?.id,
            route_type: [
                RouteType.HEAVY_RAIL,
                RouteType.LIGHT_RAIL,
                RouteType.COMMUTER_RAIL,
                RouteType.BUS,
            ],
        },
        include: ["route", "vehicle", "trip", "stop"],
    });

    const alertsFetchParams = $derived({
        filters: {
            stop: selectedStop?.id,
            route_type: [RouteType.HEAVY_RAIL, RouteType.LIGHT_RAIL],
        },
    });

    async function setSelectedRoute(value: RouteResource) {
        const params = new URLSearchParams({ route: value.id });
        goto(`?${params}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
        });
        setSelectedStop(undefined);
    }

    async function setSelectedDirectionId(value: number) {
        const params = new URLSearchParams({
            route: data.route.id,
            direction: value.toString(),
        });
        goto(`?${params}`, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
        });
        setSelectedStop(undefined);
    }

    async function setSelectedRoutePattern(value: RoutePatternResource) {
        const url = new URL(page.url);
        url.searchParams.set("pattern", value.id);
        goto(url, {
            replaceState: true,
            noScroll: true,
            keepFocus: true,
        });
        setSelectedStop(undefined);
    }

    async function setSelectedStop(value?: StopResource) {
        selectedStop = value;

        // If there's currently a prediction stream open, stop listening
        if (predictions) {
            predictions.close();
            predictions = undefined;
            alerts!.close();
            alerts = undefined;
        }

        // If a stop was selected, start listening to predictions and alerts
        if (selectedStop) {
            const predictionsEventSource = apiClient.listen(
                "predictions",
                predictionsFetchParams,
            );
            const alertsEventSource = apiClient.listen(
                "alerts",
                alertsFetchParams,
            );

            const timeAscending = (
                a: PredictionResource,
                b: PredictionResource,
            ) =>
                dayjs(a.arrival_time ?? b.departure_time).diff(
                    b.arrival_time ?? b.departure_time,
                );

            predictions = new MbtaStreamedCollection(
                "prediction",
                predictionsEventSource,
                timeAscending,
            );
            alerts = new MbtaStreamedCollection("alert", alertsEventSource);
        }
    }

    async function fetchStopSchedules(
        stopId: string,
        routeId: string,
    ): Promise<readonly ScheduleResource[]> {
        return await fetchNextSchedules(apiClient, stopId, dayjs(), routeId);
    }

    // ====== DRAWER ======
    // (Can't be $derived because relation with selectedStop is two-way)
    let drawerOpen: boolean = $state(false);
    $effect(() => {
        // Open drawer if selecting a stop, close if deselecting
        drawerOpen = selectedStop !== undefined;
    });

    function setDrawerOpen(value: boolean) {
        drawerOpen = value;
        // If closing drawer, deselect stop
        if (!drawerOpen) {
            selectedStop = undefined;
        }
    }
</script>

<main>
    <div class="route-view scroll-container" in:fade>
        <RoutePatternSelect
            routeOptions={data.routeOptions}
            bind:selectedRoute={() => data.route, setSelectedRoute}
            bind:selectedDirectionId={
                () => data.direction, setSelectedDirectionId
            }
            bind:selectedRoutePattern={
                () => data.pattern, setSelectedRoutePattern
            }
        />
        {#await data.stops}
            <Loading />
        {:then stops}
            <div class="stop-list" in:fade>
                <StopList
                    route={data.route}
                    {stops}
                    onSelectStop={setSelectedStop}
                />
            </div>
        {:catch}
            <p>Failed to get list of stops on route.</p>
        {/await}
    </div>

    {#snippet stopViewContent()}
        <!-- If there's a selected stop -->
        <!-- When using drawer, there always should be -->
        {#if selectedStop}
            <!-- Get list of expected arrivals -->
            {#await arrivals}
                <!-- Before arrivals are available, show with none -->
                <StopInfo stop={selectedStop} route={data.route} />
            {:then arrivals}
                <!-- Show with the arrivals -->
                <StopInfo
                    stop={selectedStop}
                    route={data.route}
                    {arrivals}
                    alerts={alerts?.data}
                />
            {/await}
        {/if}
    {/snippet}

    <!-- On large screens, show to the side; on small, use drawer -->
    <div class="side-info-panel">
        {#if isLargeScreen() && selectedStop}
            {@render stopViewContent()}
        {:else}
            <div class="small-message">
                <Milestone
                    size={48}
                    color="var(--fg-primary)"
                    aria-hidden="true"
                />
                <p>Select a stop for more info.</p>
            </div>
        {/if}
    </div>

    {#if !isLargeScreen()}
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
                    {@render stopViewContent()}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    {/if}
</main>

<style>
    main {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .route-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 480px;
        width: 100%;
        padding: 0 12px 12px 12px;
    }

    .stop-list {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .side-info-panel {
        display: none;
    }

    @media (min-width: 1024px) {
        main {
            height: 100%;
            min-height: 0;
        }
        .route-view {
            height: 100%;
            overflow-y: auto;
            overflow-x: clip;
            padding: 0 24px 0 36px;
        }
        .side-info-panel {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
        }
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
