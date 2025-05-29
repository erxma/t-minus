<script lang="ts">
    import "$lib/global.css";
    import RoutePill from "../common/RoutePill.svelte";
    import "./route-select.css";

    import type { RoutePatternResource, RouteResource } from "@t-minus/shared";

    import { ArrowRightLeft, ChevronDown } from "@lucide/svelte";
    import { Select } from "bits-ui";

    interface Props {
        routeOptions: RouteResource[];
        /** The route to show info for. */
        selectedRoute: RouteResource;
        /** ID of the direction to show info for. Defaults to 0. */
        selectedDirectionId: number;
        /** The route pattern to show info for. Default to first for route and direction. */
        selectedRoutePattern: RoutePatternResource;
    }

    let {
        routeOptions,
        selectedRoute = $bindable(),
        selectedDirectionId = $bindable(),
        selectedRoutePattern = $bindable(),
    }: Props = $props();

    const routePatternOptions = $derived(
        selectedRoute.route_patterns!.filter(
            (p) => p.direction_id === selectedDirectionId,
        ),
    );

    const directionDisplayName: string = $derived.by(() => {
        const name = selectedRoute.direction_names![selectedDirectionId];
        if (name.endsWith("bound")) {
            return name;
        } else {
            return name + "bound";
        }
    });

    function onReverseDirection() {
        selectedDirectionId = selectedDirectionId === 0 ? 1 : 0;
        selectedRoutePattern = routePatternOptions[0];
    }
</script>

<div class="container">
    <div class="select-route">
        <Select.Root
            type="single"
            onValueChange={(v) => {
                selectedRoute = routeOptions.find((route) => route.id === v)!;
                selectedDirectionId = 0;
                selectedRoutePattern = routePatternOptions[0];
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

    <div class="select-dir-and-pattern">
        <div class="dir-and-pattern-name">
            <span class="current-direction">
                <b>{directionDisplayName.toUpperCase()}</b></span
            >
            <div class="select-pattern">
                {#if routePatternOptions.length > 1}
                    <Select.Root
                        type="single"
                        onValueChange={(v) => {
                            selectedRoutePattern =
                                selectedRoute.route_patterns?.find(
                                    (p) => p.id === v,
                                )!;
                        }}
                    >
                        <Select.Trigger
                            aria-label="Select route pattern"
                            class="select-trigger-pattern"
                        >
                            <span
                                class="select-trigger-inner select-trigger-inner-pattern"
                            >
                                <b>{selectedRoutePattern.name}</b>
                                <ChevronDown />
                            </span></Select.Trigger
                        >
                        <Select.Portal>
                            <Select.Content class="select-content">
                                {#each routePatternOptions as pattern (pattern.id)}
                                    <Select.Item
                                        value={pattern.id}
                                        label={pattern.name}
                                        class="select-item select-item-pattern"
                                        >{pattern.name}</Select.Item
                                    >
                                {/each}
                            </Select.Content>
                        </Select.Portal>
                    </Select.Root>
                {:else}
                    <span><b>{selectedRoutePattern.name}</b></span>
                {/if}
            </div>
        </div>
        <button class="button-default" onclick={onReverseDirection}
            ><ArrowRightLeft aria-hidden="true" /><span class="visually-hidden"
                >Reverse direction</span
            ></button
        >
    </div>
</div>

<style>
    .container {
        width: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        margin: 0.6em;
    }

    .select-trigger-inner {
        display: inline-flex;
        align-items: center;
        color: var(--fg-primary);
    }

    .select-route {
        padding: 0.2em 0.6em;
    }

    .select-dir-and-pattern {
        width: 100%;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    .dir-and-pattern-name {
        font-size: var(--font-size-m);
        display: flex;
        flex-direction: column;
    }

    .select-trigger-inner-pattern,
    .select-pattern {
        font-size: var(--font-size-l);
    }
</style>
