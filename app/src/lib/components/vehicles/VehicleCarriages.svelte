<script lang="ts">
    import {
        ArrowBigLeft,
        Ban,
        CircleDashed,
        CircleQuestionMark,
    } from "@lucide/svelte";
    import type {
        OccupancyStatus,
        RouteResource,
        VehicleResource,
    } from "@t-minus/shared";

    let {
        vehicle,
        route,
    }: { vehicle: VehicleResource; route?: RouteResource } = $props();

    export type VisualKind = "scale" | "closed" | "unknown";

    export interface StatusMeta {
        kind: VisualKind;
        segments?: number;
        shade?: number;
        label: string;
    }

    const STATUS_META: Record<OccupancyStatus, StatusMeta> = {
        MANY_SEATS_AVAILABLE: {
            kind: "scale",
            segments: 1,
            shade: 1.3,
            label: "Many seats available",
        },
        FEW_SEATS_AVAILABLE: {
            kind: "scale",
            segments: 2,
            shade: 1,
            label: "Few seats available",
        },
        STANDING_ROOM_ONLY: {
            kind: "scale",
            segments: 3,
            shade: 0.8,
            label: "Standing room only",
        },
        CRUSHED_STANDING_ROOM_ONLY: {
            kind: "scale",
            segments: 4,
            shade: 0.6,
            label: "Crushed standing room",
        },
        FULL: {
            kind: "scale",
            segments: 4,
            shade: 0.5,
            label: "Full",
        },
        NOT_ACCEPTING_PASSENGERS: {
            kind: "closed",
            label: "Not accepting passengers",
        },
        NO_DATA_AVAILABLE: {
            kind: "unknown",
            label: "No data available",
        },
    };

    const lineColor = $derived(route ? `#${route.color}` : "#ddd");
    const carriages = $derived(vehicle.carriages ?? []);
    const hasOccupancyData = $derived(
        carriages.some((c) => c.occupancy_status !== "NO_DATA_AVAILABLE"),
    );
</script>

<div class="console" style:--line-color={lineColor}>
    <div class="header">
        <!-- Vehicle label -->
        <span class="vehicle-label">Vehicle {vehicle.label} </span>

        <!-- If there are carriages but not occupancy data, specify this -->
        {#if carriages.length > 0 && !hasOccupancyData}
            <div class="no-data-note">
                <CircleDashed size={13} strokeWidth={2} />
                <span>No occupancy data available</span>
            </div>
        {/if}
    </div>

    <!-- If there are any carriages to show... -->
    {#if carriages.length > 0}
        <div class="chain-wrapper">
            <!-- An arrow for indicating the front of the vehicle -->
            <ArrowBigLeft size={16} strokeWidth={0} fill="var(--line-color)" />

            <!-- Chain of carriage car shapes -->
            <div class="chain" role="list">
                {#each carriages as carriage, i (carriage.label)}
                    {@const meta = STATUS_META[carriage.occupancy_status]}

                    <!-- A rectangle-ish car shape for each carriage, with its label,
                         and occupancy status if available -->
                    <!-- Leftmost and rightmost carriages have curved fronts -->
                    <!-- Carriages not accepting passengers have a greyed out stripe pattern -->
                    <div
                        class="carriage"
                        class:nose-left={i === 0}
                        class:nose-right={i === carriages.length - 1}
                        class:closed={hasOccupancyData &&
                            meta.kind === "closed"}
                        role="listitem"
                        aria-label="{i === 0 ? 'Front carriage' : 'Carriage'}
                        {carriage.label}{hasOccupancyData
                            ? `, ${meta.label}`
                            : ''}"
                    >
                        <span class="carriage-label">{carriage.label}</span>

                        {#if hasOccupancyData}
                            <div class="occupancy-indicator">
                                {#if meta.kind === "scale"}
                                    <!-- For normal occupancy, data, show some number of
                                         bars filled out of 4, and with varying shades of
                                         the line color for the filled segments -->
                                    <div
                                        class="segments"
                                        style:--shade={meta.shade}
                                        aria-hidden="true"
                                    >
                                        {#each Array(4) as _, i}
                                            <span
                                                class="segment"
                                                class:filled={i <
                                                    meta.segments!}
                                            ></span>
                                        {/each}
                                    </div>
                                {:else if meta.kind === "closed"}
                                    <!-- For cars not accepting passengers, show "no entry" icon -->
                                    <Ban size={14} strokeWidth={3} />
                                {:else}
                                    <!-- For cars with no data, show question mark icon -->
                                    <CircleQuestionMark
                                        size={14}
                                        strokeWidth={3}
                                    />
                                {/if}
                            </div>
                        {/if}
                    </div>
                {/each}
            </div>
        </div>
    {:else}
        <!-- If no carriage data at all, show text placeholder for carriages -->
        <div class="no-data-note no-carriage-data-note">
            <CircleDashed size={13} strokeWidth={2} />
            <span>No carriage data available</span>
        </div>
    {/if}
</div>

<style>
    .console {
        background: var(--surface);
        border-radius: 12px;
        padding: 6px 12px;
        width: 100%;
    }

    .header {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 4px;
        margin-bottom: 14px;
    }

    .vehicle-label {
        font-weight: bold;
        font-size: var(--font-size-s);
    }

    .no-data-note {
        display: flex;
        align-items: center;
        gap: 0.6em;
        font-size: var(--font-size-xs);
        color: var(--fg-primary);
    }

    .no-carriage-data-note {
        margin: 10px 0.5em;
    }

    .chain-wrapper {
        display: flex;
        width: 100%;
        align-items: center;
        gap: 4px;
    }

    .chain {
        display: flex;
        flex: 1;
        overflow-x: auto;
        padding: 4px 2px 8px;
        scroll-snap-type: x proximity;
        gap: 4px;
    }

    .carriage {
        position: relative;
        flex: 1 1 0;
        min-width: 60px;
        max-width: 110px;
        height: 40px;
        scroll-snap-align: start;
        background: var(--muted);
        border-radius: 2px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        box-sizing: border-box;
    }

    .carriage.nose-left {
        border-top-left-radius: 22px;
    }

    .carriage.nose-right {
        border-top-right-radius: 22px;
    }

    .carriage.closed {
        --stripe-1: oklch(from var(--muted) calc(l * 1.1) c h);
        --stripe-2: oklch(from var(--muted) calc(l * 1.25) c h);
        background: repeating-linear-gradient(
            135deg,
            var(--stripe-1),
            var(--stripe-1) 5px,
            var(--stripe-2) 5px,
            var(--stripe-2) 10px
        );
    }

    .carriage-label {
        font-size: var(--font-size-xs);
        font-weight: bold;
    }

    .occupancy-indicator {
        height: 10px;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .segments {
        display: flex;
        gap: 3px;
    }

    .segment {
        width: 10px;
        height: 6px;
        border-radius: 2px;
        background: #141414;
    }

    .segment.filled {
        background: oklch(from var(--line-color) calc(l * var(--shade)) c h);
    }
</style>
