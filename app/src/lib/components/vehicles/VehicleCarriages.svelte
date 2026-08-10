<script lang="ts">
    import "./vehicles.css";
    import {
        ArrowBigLeft,
        Ban,
        CircleDashed,
        CircleQuestionMark,
    } from "@lucide/svelte";
    import type { RouteResource, VehicleResource } from "@t-minus/shared";
    import { OCCUPANCY_STATUS_META } from "./occupancy";

    let {
        vehicle,
        route,
    }: { vehicle: VehicleResource; route?: RouteResource } = $props();

    const lineColor = $derived(route ? `#${route.color}` : "#ddd");
    const carriages = $derived(vehicle.carriages ?? []);
    const hasCarriageOccupancyData = $derived(
        carriages.some((c) => c.occupancy_status !== "NO_DATA_AVAILABLE"),
    );
</script>

<!-- If there are any carriages to show... -->
{#if carriages.length > 0}
    <div class="chain-wrapper" style:--line-color={lineColor}>
        <!-- An arrow for indicating the front of the vehicle -->
        <ArrowBigLeft size={16} strokeWidth={0} fill="var(--line-color)" />

        <!-- Chain of carriage car shapes -->
        <div class="chain" role="list">
            {#each carriages as carriage, i (carriage.label)}
                {@const meta = OCCUPANCY_STATUS_META[carriage.occupancy_status]}

                <!-- A rectangle-ish car shape for each carriage, with its label,
                         and occupancy status if available -->
                <!-- Leftmost and rightmost carriages have curved fronts -->
                <!-- Carriages not accepting passengers have a greyed out stripe pattern -->
                <div
                    class="carriage"
                    class:nose-left={i === 0}
                    class:nose-right={i === carriages.length - 1}
                    class:closed={hasCarriageOccupancyData &&
                        meta.kind === "closed"}
                    role="listitem"
                    aria-label="{i === 0 ? 'Front carriage' : 'Carriage'}
                        {carriage.label}{hasCarriageOccupancyData
                        ? `, ${meta.label}`
                        : ''}"
                >
                    <span class="carriage-label">{carriage.label}</span>

                    {#if hasCarriageOccupancyData}
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
                                            class:filled={i < meta.segments!}
                                        ></span>
                                    {/each}
                                </div>
                            {:else if meta.kind === "closed"}
                                <!-- For cars not accepting passengers, show "no entry" icon -->
                                <Ban size={14} strokeWidth={3} />
                            {:else}
                                <!-- For cars with no data, show question mark icon -->
                                <CircleQuestionMark size={14} strokeWidth={3} />
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

<style>
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
</style>
