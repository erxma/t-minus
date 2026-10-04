<script lang="ts">
    import "$lib/global.css";

    import type { RoutePatternResource, RouteResource } from "@t-minus/shared";

    import { ArrowRightLeft, ChevronDown } from "@lucide/svelte";
    import RoutePill from "../common/RoutePill.svelte";
    import { Select } from "melt/builders";

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

    const select = new Select<string>({
        value: () => selectedRoutePattern.id,
        onValueChange: (v) => {
            if (v !== undefined) {
                selectedRoutePattern = route.route_patterns?.find(
                    (p) => p.id === v,
                )!;
            }
        },
    });
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
                    <button
                        {...select.trigger}
                        aria-label="Select route pattern"
                        class="select-trigger"
                    >
                        <b>{selectedRoutePattern.name}</b>
                        <ChevronDown />
                    </button>

                    <div {...select.content} class="select-content">
                        {#each routePatternOptions as pattern (pattern.id)}
                            <div
                                {...select.getOption(pattern.id, pattern.name)}
                                class="select-item"
                            >
                                {pattern.name}
                            </div>
                        {/each}
                    </div>
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

    .select-pattern {
        font-size: var(--font-size-l);
    }

    .select-trigger {
        display: inline-flex;
        align-items: center;
        padding: 0;

        border: none;
        background: none;
        color: var(--fg-primary);
        font-size: inherit;
        text-align: left;
    }

    .select-content {
        /* Reset UA popover positioning */
        margin: 0;
        inset: auto;

        flex-direction: column;
        align-items: center;
        padding: 8px;
        max-height: 300px;
        overflow-y: scroll;

        background-color: var(--bg-primary);
        border: var(--border-primary);
        border-radius: var(--border-radius);
        user-select: none;
    }

    .select-content:popover-open {
        display: flex;
    }

    .select-item {
        display: flex;
        justify-content: center;
        width: 100%;
        padding: 6px;
        box-sizing: border-box;
        border-radius: var(--border-radius);
        user-select: none;
    }

    .select-item[data-highlighted] {
        outline: 2px solid var(--fg-primary);
    }
</style>
