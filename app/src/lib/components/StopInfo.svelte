<script lang="ts">
    import "$lib/global.css";
    import AccessibilityIcon from "./common/AccessibilityIcon.svelte";
    import Loading from "./common/Loading.svelte";
    import RoutePill from "./common/RoutePill.svelte";

    import { CalendarClock, CircleAlert, Clock, Radio } from "@lucide/svelte";
    import { fade } from "svelte/transition";

    import { countdownText } from "$lib/util/formatting";
    import {
        groupArrivalsByPlatform,
        type AlertResource,
        type PredictionResource,
        type RouteResource,
        type ScheduleResource,
        type StopResource,
    } from "@t-minus/shared";

    interface Props {
        stop: StopResource;
        route: RouteResource;
        arrivals?:
            | readonly Readonly<PredictionResource | ScheduleResource>[]
            | Error;
        alerts?: readonly Readonly<AlertResource>[];
    }

    const { stop, route, arrivals, alerts }: Props = $props();
</script>

<div
    class="stop-info"
    style:--route-color="#{route.color}"
    style:--route-text-color="#{route.text_color}"
>
    <span class="stop-title"
        ><span class="stop-title-left"
            ><h2>{stop.name?.toUpperCase()}</h2>
            {#if alerts && alerts.filter((a) => a.lifecycle !== "UPCOMING").length > 0}
                <span aria-hidden="true">
                    <CircleAlert
                        color="black"
                        fill="var(--warning)"
                        size="24"
                    />
                </span>
                <span class="visually-hidden">Alert active</span>
            {/if}
        </span>
        <AccessibilityIcon
            wheelchairBoarding={stop.wheelchair_boarding}
            size="24"
        />
    </span>

    {#if !arrivals}
        <Loading />
    {:else if arrivals instanceof Error}
        <p>Failed to get upcoming arrivals.</p>
    {:else if arrivals.length > 0}
        {@const platformArrivals = Object.entries(
            groupArrivalsByPlatform(arrivals),
        ).sort((a, b) => a[0].localeCompare(b[0]))}
        <ol in:fade|global class="platform-list">
            {#each platformArrivals as [platformName, arrivals] (platformName)}
                <li class="platform">
                    <span class="platform-name"><h2>{platformName}</h2></span>
                    <ol>
                        {#each arrivals as arrival (arrival.id)}
                            <li class="arrival">
                                <span class="headsign">
                                    <RoutePill
                                        route={arrival.route!}
                                        abbreviate={true}
                                        colorUnderneath="var(--surface)"
                                        size="var(--font-size-m)"
                                    />
                                    {arrival.trip!.headsign}
                                    {#if !arrival.departure_time}(drop-off){/if}
                                </span>
                                {#key countdownText(arrival)}
                                    <span
                                        class="arrival-time"
                                        in:fade={{ duration: 800 }}
                                    >
                                        {#if arrival.type === "prediction"}
                                            <span
                                                aria-hidden="true"
                                                title="Live Prediction"
                                                ><Radio /></span
                                            >
                                            <span class="visually-hidden"
                                                >Live prediction</span
                                            >
                                        {:else}
                                            <span
                                                aria-hidden="true"
                                                title="Scheduled"
                                                ><CalendarClock /></span
                                            >
                                            <span class="visually-hidden"
                                                >Scheduled</span
                                            >
                                        {/if}
                                        <span>{countdownText(arrival)}</span>
                                    </span>
                                {/key}
                            </li>
                        {/each}
                    </ol>
                </li>
            {/each}
        </ol>
    {:else}
        <div class="no-info">
            <Clock size={48} color="var(--fg-primary)" />
            <p>No upcoming arrivals information available.</p>
        </div>
    {/if}
</div>

<style>
    .stop-info {
        height: 100%;
        display: flex;
        flex-direction: column;
    }

    .stop-title {
        background-color: var(--route-color);
        color: var(--route-text-color);
        padding: 0.5em 1em 0.5em 0.5em;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .stop-title-left {
        display: flex;
        align-items: center;
    }

    h2 {
        font-size: var(--font-size-l);
    }

    .stop-title h2 {
        margin: 0 20px;
    }

    ol {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .platform-list {
        padding-bottom: 64px;
        overflow-y: auto;
    }

    .platform {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--border-radius);
        border: var(--border-primary);
        margin: 12px;
    }

    .platform-name {
        background-color: var(--muted);
        padding: 0.1em 0;
    }

    .platform-name h2 {
        margin: 2px 10px;
    }

    .arrival {
        padding: 0.3em 0.7em;
        display: flex;
        justify-content: space-between;

        font-size: var(--font-size-m);
    }

    .arrival:not(:last-child) {
        border-bottom: var(--border-primary);
    }

    .headsign {
        display: inline-flex;
        align-items: center;
        gap: 0.5em;
    }

    .arrival-time {
        display: inline-flex;
        justify-content: right;
        align-items: center;
        gap: 0.2em;
        text-align: right;
    }

    .arrival-time > span {
        display: inline-flex;
        align-items: center;
    }

    .no-info {
        display: flex;
        flex-direction: column;
        align-items: center;
        font-size: larger;
        padding: 1em;

        text-align: center;
    }
</style>
