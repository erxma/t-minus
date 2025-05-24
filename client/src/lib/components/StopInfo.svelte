<script lang="ts">
    import "$lib/global.css";
    import AccessibilityIcon from "./common/AccessibilityIcon.svelte";
    import Loading from "./common/Loading.svelte";
    import RoutePill from "./common/RoutePill.svelte";

    import { CalendarClock, Clock, Radio } from "@lucide/svelte";
    import { fade } from "svelte/transition";

    import { countdownText } from "$lib/util/formatting";
    import type {
        PredictionResource,
        RouteResource,
        ScheduleResource,
        StopResource,
    } from "@t-minus/shared";

    interface Props {
        stop: StopResource;
        route: RouteResource;
        arrivals?:
            | readonly Readonly<PredictionResource | ScheduleResource>[]
            | Error;
    }

    const { stop, route, arrivals: arrivals }: Props = $props();
</script>

<div
    class="stop-info"
    style:--route-color="#{route.color}"
    style:--route-text-color="#{route.text_color}"
>
    <span class="stop-title"
        ><h2>{stop.name?.toUpperCase()}</h2>
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
        <ol in:fade|global>
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
                        <span class="arrival-time" in:fade={{ duration: 800 }}>
                            {#if arrival.type === "prediction"}
                                <span aria-hidden="true" title="Live Prediction"
                                    ><Radio /></span
                                >
                                <span class="visually-hidden"
                                    >Live prediction</span
                                >
                            {:else}
                                <span aria-hidden="true" title="Scheduled"
                                    ><CalendarClock /></span
                                >
                                <span class="visually-hidden">Scheduled</span>
                            {/if}
                            <span>{countdownText(arrival)}</span>
                        </span>
                    {/key}
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

    h2 {
        font-size: var(--font-size-l);
        margin: 0 20px;
    }

    ol {
        list-style: none;
        padding: 0;
        margin: 0;
        padding-bottom: 64px;
        overflow-y: auto;
        height: 100%;

        display: flex;
        flex-direction: column;
    }

    .arrival {
        padding: 0.3em 0.7em;
        display: grid;
        grid-template-columns: 2fr 1fr;

        font-size: var(--font-size-m);
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
        gap: 0.2em;
        text-align: right;
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
