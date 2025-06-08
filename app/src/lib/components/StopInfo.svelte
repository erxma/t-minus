<script lang="ts">
    import "$lib/global.css";
    import AccessibilityIcon from "./common/AccessibilityIcon.svelte";
    import Loading from "./common/Loading.svelte";
    import RoutePill from "./common/RoutePill.svelte";

    import { CalendarClock, Clock, Radio } from "@lucide/svelte";
    import { fade } from "svelte/transition";

    import { countdownText } from "$lib/util/formatting";
    import {
        entityIsAffectedByAlert,
        groupArrivalsByChildStop,
        RouteType,
        type AlertResource,
        type ArrivalResource,
        type RouteResource,
        type StopResource,
    } from "@t-minus/shared";
    import Alerts from "./Alerts.svelte";
    import AlertIcon from "./common/AlertIcon.svelte";
    import CommuterRailTripPill from "./common/CommuterRailTripPill.svelte";

    interface Props {
        stop: StopResource;
        route: RouteResource;
        arrivals?: readonly Readonly<ArrivalResource>[] | Error;
        alerts?: readonly Readonly<AlertResource>[];
    }

    const { stop, route, arrivals, alerts }: Props = $props();

    const platformGroups = $derived(
        arrivals && !(arrivals instanceof Error)
            ? groupArrivalsByChildStop(arrivals)
            : undefined,
    );
    const activeAlerts = $derived(
        alerts?.filter((a) => a.lifecycle !== "UPCOMING"),
    );
    const isAffectedByAlert: boolean = $derived(
        activeAlerts !== undefined &&
            activeAlerts.some((alert) =>
                // Recommended practice is to check alerts for entire route
                // if no info on a users's specific trip
                entityIsAffectedByAlert({ route: route.id }, alert),
            ),
    );
</script>

<div
    class="stop-info"
    style:--route-color="#{route.color}"
    style:--route-text-color="#{route.text_color}"
>
    <span class="stop-title"
        ><span class="stop-title-left"
            ><h2>{stop.name}</h2>
            {#if isAffectedByAlert}
                <AlertIcon />
            {/if}
        </span>
        <AccessibilityIcon
            wheelchairBoarding={stop.wheelchair_boarding}
            size="24"
        />
    </span>
    <div class="content">
        {#if activeAlerts && activeAlerts.length > 0}
            <div in:fade|global><Alerts alerts={activeAlerts} /></div>
        {/if}
        {#if !arrivals}
            <Loading />
        {:else if arrivals instanceof Error}
            <p>Failed to get upcoming arrivals.</p>
        {:else if arrivals.length > 0}
            {#snippet platformBox(
                stop: StopResource,
                arrivals: ArrivalResource[],
            )}
                <li class="platform">
                    <span class="platform-name"
                        ><h2>{stop.platform_name}</h2></span
                    >
                    <ol>
                        {#each arrivals as arrival (arrival.id)}
                            <li class="arrival">
                                <span class="headsign">
                                    {#if arrival.route!.type_ === RouteType.COMMUTER_RAIL}
                                        <CommuterRailTripPill
                                            trip={arrival.trip!}
                                            route={arrival.route!}
                                            size="var(--font-size-m)"
                                        />
                                    {:else}
                                        <RoutePill
                                            route={arrival.route!}
                                            abbreviate={true}
                                            colorUnderneath="var(--surface)"
                                            size="var(--font-size-m)"
                                        />
                                    {/if}
                                    {arrival.trip!.headsign}
                                    <!-- If no departure time, passengers can't board.
                                     Exception is CR predictions sometimes have neither time; typically with a status.
                                     If also no times and no status, stop will not be made. -->
                                    <!-- TODO: When stop won't be made, should refer to schedule relationship  -->
                                    {#if !arrival.departure_time && arrival.arrival_time}(drop-off){/if}
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
            {/snippet}
            <!-- FIXME: This isn't accurate in many cases at start of route -->
            {@const primaryPlatform = platformGroups!.find(
                (g) => g.stop.id === stop.id,
            )}
            {@const otherPlatforms = platformGroups!
                .filter((g) => g.stop.id !== stop.id)
                .sort((a, b) =>
                    a.stop.platform_name!.localeCompare(b.stop.platform_name!),
                )}
            <div in:fade>
                {#if primaryPlatform}
                    <ol class="platform-list">
                        {@render platformBox(
                            primaryPlatform.stop,
                            primaryPlatform.arrivals,
                        )}
                    </ol>
                {:else}
                    <div class="no-info">
                        <Clock size={48} color="var(--fg-primary)" />
                        <p>
                            No predictions at this stop for the selected route
                            pattern right now.
                        </p>
                    </div>
                {/if}
                {#if otherPlatforms.length > 0}
                    <hr />
                    <div>
                        <h3>OTHER PLATFORMS</h3>
                        <ol class="platform-list">
                            {#each otherPlatforms as group (group.stop.id)}
                                {@render platformBox(
                                    group.stop,
                                    group.arrivals,
                                )}
                            {/each}
                        </ol>
                    </div>
                {/if}
            </div>
        {:else}
            <div class="no-info">
                <Clock size={48} color="var(--fg-primary)" />
                <p>No upcoming arrivals information available.</p>
            </div>
        {/if}
    </div>
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
        text-transform: uppercase;
    }

    .stop-title-left {
        display: inline-flex;
        align-items: center;
        gap: 0.4em;
        margin-left: 1em;
    }

    h2 {
        font-size: var(--font-size-l);
        margin: 0;
    }

    .content {
        display: flex;
        flex-direction: column;
        gap: 24px;
        overflow-y: scroll;
        padding: 12px;
        height: 100%;
        padding-bottom: 64px;
    }

    ol {
        list-style: none;
        padding: 0;
        margin: 0;
    }

    .platform-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    hr {
        border: none;
        border-top: 3px solid var(--muted);
        width: 100%;
        margin: 12px 0;
    }

    h3 {
        font-size: var(--font-size-m);
        margin: 12px 8px;
    }

    .platform {
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--border-radius);
        border: var(--border-primary);
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
