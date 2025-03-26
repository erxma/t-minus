<script lang="ts">
    import "@/global.css";
    import RoutePill from "../common/RoutePill.svelte";
    import "./route-select.css";

    import type { RouteResource } from "@t-minus/shared";

    import { ArrowRight, ArrowRightLeft, ChevronDown } from "@lucide/svelte";
    import { Select } from "bits-ui";

    interface Props {
        routeOptions: RouteResource[];
        /** The route to show info for. Defaults to first one. */
        selectedRoute: RouteResource;
        /** ID of the direction to show info for. Defaults to 0. */
        selectedDirectionId: number;
    }

    let {
        routeOptions,
        selectedRoute = $bindable(),
        selectedDirectionId = $bindable(),
    }: Props = $props();
</script>

<div class="select-route-pattern">
    <div class="select-route">
        <Select.Root
            type="single"
            onValueChange={(v) => {
                selectedRoute = routeOptions.find((route) => route.id === v)!;
                selectedDirectionId = 0;
            }}
        >
            <Select.Trigger aria-label="Select route">
                <span class="select-trigger-inner">
                    <RoutePill route={selectedRoute} />
                    <ChevronDown />
                </span>
            </Select.Trigger>
            <Select.Portal>
                <Select.Content class="select-content">
                    {#each routeOptions as route (route.id)}
                        <Select.Item
                            value={route.id}
                            label={route.long_name}
                            class="select-item"
                        >
                            <RoutePill {route} size="var(--font-size-m)" />
                        </Select.Item>
                    {/each}
                </Select.Content>
            </Select.Portal>
        </Select.Root>
    </div>
    <!--
     Select with one option for each direction for select route.
    -->
    <div class="select-direction">
        <span class="current-direction"
            ><ArrowRight />
            <span
                >To
                <b>
                    {selectedRoute.direction_destinations![
                        selectedDirectionId
                    ]}</b
                ></span
            ></span
        >
        <button
            class="button-default"
            onclick={() =>
                (selectedDirectionId = selectedDirectionId === 0 ? 1 : 0)}
            ><ArrowRightLeft aria-hidden="true" /><span class="visually-hidden"
                >Reverse direction</span
            ></button
        >
    </div>
</div>

<style>
    .select-route-pattern {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0.6em;
    }

    .select-route {
        padding: 0.2em 0.6em;
    }

    .select-direction {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .current-direction {
        font-size: var(--font-size-l);
        border-radius: calc(infinity * 1px);
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .select-trigger-inner {
        display: inline-flex;
        align-items: center;
        color: var(--fg-primary);
    }
</style>
