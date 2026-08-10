<script lang="ts">
    import "./vehicles.css";
    import { CircleDashed } from "@lucide/svelte";
    import type { RouteResource, VehicleResource } from "@t-minus/shared";
    import VehicleCarriages from "./VehicleCarriages.svelte";
    import { OCCUPANCY_STATUS_META } from "./occupancy";

    interface Props {
        vehicle: VehicleResource;
        route?: RouteResource;
    }

    let { vehicle, route }: Props = $props();

    const lineColor = $derived(route ? `#${route.color}` : "#ddd");
    const carriages = $derived(vehicle.carriages ?? []);
    const hasCarriageOccupancyData = $derived(
        carriages.some((c) => c.occupancy_status !== "NO_DATA_AVAILABLE"),
    );

    const vehicleMeta = $derived(
        vehicle.occupancy_status
            ? OCCUPANCY_STATUS_META[vehicle.occupancy_status]
            : undefined,
    );
</script>

<div class="console" style:--line-color={lineColor}>
    <div class="header">
        <!-- Vehicle label -->
        <span class="vehicle-label">
            <span>Vehicle {vehicle.label}</span>
            {#if vehicleMeta}
                <span
                    class="segments vehicle-segments"
                    style:--shade={vehicleMeta.shade}
                    aria-label={vehicleMeta.label}
                >
                    {#each Array(4) as _, i}
                        <span
                            class="segment"
                            class:filled={i < vehicleMeta.segments!}
                        ></span>
                    {/each}
                </span>
            {/if}</span
        >

        <!-- If there are carriages but not occupancy data, specify this -->
        {#if carriages.length > 0 && !hasCarriageOccupancyData && !vehicle.occupancy_status}
            <div class="no-data-note">
                <CircleDashed size={13} strokeWidth={2} />
                <span>No occupancy data available</span>
            </div>
        {/if}
    </div>

    <VehicleCarriages {vehicle} {route} />
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
        display: inline-flex;
        align-items: center;
        gap: 1em;
        font-weight: bold;
        font-size: var(--font-size-s);
    }

    .vehicle-segments {
        padding: 6px 8px;
        border-radius: 8px;
        background-color: var(--muted);
    }
</style>
