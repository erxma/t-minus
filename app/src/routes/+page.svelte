<script lang="ts">
    import "$lib/global.css";

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
    import ListViewPage from "./ListViewPage.svelte";

    let { data }: PageProps = $props();

    let selectedRoute: RouteResource = $state(data.initialRoute);
    let selectedDirectionId: number = $state(data.initialDirection);
    let routeStops: StopResource[] | Promise<StopResource[]> = $state(
        data.initialStops,
    );

    let selectedStop: StopResource | undefined = $state();

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

    async function setSelectedDirectionId(value: number) {
        selectedDirectionId = value;
        routeStops = fetchRouteStops(selectedRoute.id, selectedDirectionId);

        const url = new URL(page.url);
        url.searchParams.set("direction", value.toString());
        replaceState(url, {});
    }

    function setSelectedStop(value?: StopResource) {
        // Set value
        selectedStop = value;
        // If selecting a stop, open the drawer and start listening for predictions
        if (selectedStop) {
            predictions = streamPredictions(selectedStop.id);
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

<ListViewPage
    routeOptions={data.routeOptions}
    bind:selectedRoute={() => selectedRoute, setSelectedRoute}
    bind:selectedDirectionId={() => selectedDirectionId, setSelectedDirectionId}
    {routeStops}
    bind:selectedStop={() => selectedStop, setSelectedStop}
    {arrivals}
/>
