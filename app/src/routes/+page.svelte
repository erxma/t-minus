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
    import { replaceState } from "$app/navigation";
    import ListViewPage from "./ListViewPage.svelte";

    type Arrivals =
        | readonly Readonly<ScheduleResource>[]
        | readonly Readonly<PredictionResource>[];

    let { data }: PageProps = $props();

    let selectedRoute: RouteResource = $state(data.initialRoute);
    let selectedDirectionId: number = $state(data.initialDirection);
    let selectedRoutePattern: RoutePatternResource = $state(
        data.initialPattern,
    );
    let routeStops: StopResource[] | Promise<StopResource[]> = $state(
        data.initialStops,
    );

    let selectedStop: StopResource | undefined = $state();

    let streamedPredictions:
        | MbtaStreamedCollection<PredictionResource>
        | undefined = $state();
    const streamedArrivals: Promise<Arrivals> | undefined = $derived.by(() => {
        if (!streamedPredictions?.data) {
            return undefined;
        }

        if (streamedPredictions.data.length > 0) {
            return Promise.resolve(streamedPredictions.data);
        } else {
            return fetchStopSchedules(
                selectedStop?.parent_station?.id!,
                selectedRoute.id,
            );
        }
    });
    let polledArrivals: Arrivals | undefined = $state();
    const arrivals = $derived(
        streamedArrivals ?? Promise.resolve(polledArrivals),
    );

    let streamedAlerts: MbtaStreamedCollection<AlertResource> | undefined =
        $state();
    let polledAlerts: AlertResource[] | undefined = $state();
    const alerts = $derived(streamedAlerts?.data ?? polledAlerts);

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
            stop: selectedStop?.parent_station?.id!,
            route_type: [
                RouteType.HEAVY_RAIL,
                RouteType.LIGHT_RAIL,
                RouteType.COMMUTER_RAIL,
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

    // If polling...
    if (import.meta.env.VITE_LIVE_UPDATE_METHOD === "poll") {
        $effect(() => {
            if (selectedStop) {
                const pollInterval = setInterval(
                    async () => {
                        const predictions = await apiClient.fetch(
                            "predictions",
                            predictionsFetchParams,
                        );
                        if (predictions.length > 0) {
                            polledArrivals = predictions;
                        } else {
                            polledArrivals = await fetchStopSchedules(
                                selectedStop?.parent_station?.id!,
                                selectedRoute.id,
                            );
                        }

                        polledAlerts = await apiClient.fetch(
                            "alerts",
                            alertsFetchParams,
                        );
                    },
                    import.meta.env.VITE_POLL_INTERVAL_MS,
                );
                return () => clearInterval(pollInterval);
            }
        });
    }

    async function setSelectedRoute(value: RouteResource) {
        selectedRoute = value;
        routeStops = fetchPatternStops(selectedRoutePattern);
        updateSearchParams();
    }

    async function setSelectedDirectionId(value: number) {
        selectedDirectionId = value;
        routeStops = fetchPatternStops(selectedRoutePattern);
        updateSearchParams();
    }

    async function setSelectedRoutePattern(value: RoutePatternResource) {
        selectedRoutePattern = value;
        routeStops = fetchPatternStops(selectedRoutePattern);
        updateSearchParams();
    }

    async function setSelectedStop(value?: StopResource) {
        selectedStop = value;

        // If streaming is on...
        if (import.meta.env.VITE_LIVE_UPDATE_METHOD === "stream") {
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

                window.addEventListener("beforeunload", () => {
                    predictionsEventSource.close();
                    alertsEventSource.close();
                });

                const timeAscending = (
                    a: PredictionResource,
                    b: PredictionResource,
                ) =>
                    dayjs(a.arrival_time ?? b.departure_time).diff(
                        b.arrival_time ?? b.departure_time,
                    );

                streamedPredictions = new MbtaStreamedCollection(
                    "prediction",
                    predictionsEventSource,
                    timeAscending,
                );
                streamedAlerts = new MbtaStreamedCollection(
                    "alert",
                    alertsEventSource,
                );
            } else if (streamedPredictions) {
                // If deselecting, stop listening
                streamedPredictions.close();
                streamedPredictions = undefined;
                streamedAlerts!.close();
                streamedAlerts = undefined;
            }
        }
    }

    async function fetchPatternStops(
        routePattern: RoutePatternResource,
    ): Promise<StopResource[]> {
        return await fetch(
            `/api/trip-stops?trip=${routePattern.representative_trip?.id}`,
        ).then((r) => r.json());
    }

    async function fetchStopSchedules(
        stopId: string,
        routeId: string,
    ): Promise<readonly ScheduleResource[]> {
        return await fetchNextSchedules(apiClient, stopId, dayjs(), routeId);
    }

    function updateSearchParams() {
        const url = new URL(page.url);
        url.searchParams.set("route", selectedRoute.id);
        url.searchParams.set("direction", selectedDirectionId.toString());
        url.searchParams.set("pattern", selectedRoutePattern.id);
        replaceState(url, {});
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

<ListViewPage
    routeOptions={data.routeOptions}
    bind:selectedRoute={() => selectedRoute, setSelectedRoute}
    bind:selectedDirectionId={() => selectedDirectionId, setSelectedDirectionId}
    bind:selectedRoutePattern={
        () => selectedRoutePattern, setSelectedRoutePattern
    }
    {routeStops}
    bind:selectedStop={() => selectedStop, setSelectedStop}
    {arrivals}
    {alerts}
/>
