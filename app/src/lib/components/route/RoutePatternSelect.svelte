<script lang="ts">
    import "$lib/global.css";
    import "./route-select.css";

    import type { RoutePatternResource, RouteResource } from "@t-minus/shared";

    import { ArrowRightLeft, ChevronDown } from "@lucide/svelte";
    import { Select } from "bits-ui";
    import RoutePill from "../common/RoutePill.svelte";

    interface Props {
        /** The route to show info for. */
        route: RouteResource;
        /** ID of the direction to show info for. Defaults to 0. */
        selectedDirectionId: number;
        /** The route pattern to show info for. Default to first for route and direction. */
        selectedRoutePattern: RoutePatternResource;
    }

    let {
        route,
        selectedDirectionId = $bindable(),
        selectedRoutePattern = $bindable(),
    }: Props = $props();

    const routePatternOptions = $derived(
        route.route_patterns!.filter(
            (p) => p.direction_id === selectedDirectionId,
        ),
    );

    const directionDisplayName: string = $derived.by(() => {
        const name = route.direction_names![selectedDirectionId];
        if (name.endsWith("bound")) {
            return name;
        } else {
            return name + "bound";
        }
    });

    function onReverseDirection() {
        selectedDirectionId = selectedDirectionId === 0 ? 1 : 0;
    }
</script>

<div class="container">
    <RoutePill {route} />

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
                            selectedRoutePattern = route.route_patterns?.find(
                                (p) => p.id === v,
                            )!;
                        }}
                    >
                        <Select.Trigger
                            aria-label="Select route pattern"
                            class="select-trigger-pattern"
                        >
                            <span
                                class="select-trigger-inner select-trigger-inner-pattern pattern-name"
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
                    <span class="pattern-name"
                        ><b>{selectedRoutePattern.name}</b></span
                    >
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
        gap: 12px;
        margin: 12px;
    }

    .select-trigger-inner {
        display: inline-flex;
        align-items: center;
        color: var(--fg-primary);
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

    .pattern-name {
        text-align: left;
    }

    .select-trigger-inner-pattern,
    .select-pattern {
        font-size: var(--font-size-l);
    }
</style>
