<script lang="ts">
    import AccessibilityIcon from "$lib/components/common/AccessibilityIcon.svelte";

    import type { RouteResource, StopResource } from "@t-minus/shared";

    interface Props {
        route: RouteResource;
        stops: StopResource[];
        onSelectStop: (stop: StopResource) => void;
    }

    let { route, stops, onSelectStop }: Props = $props();
</script>

<div class="stop-list">
    <div
        class="line-visual"
        style:--line-color="#{route.color}"
        aria-hidden="true"
    ></div>
    <ol>
        {#each stops as stop}
            <li>
                <button
                    onclick={() => onSelectStop(stop)}
                    style:--line-color="#{route.color}"
                >
                    <span class="stop-left">
                        <span class="stop-circle" aria-hidden="true"></span>
                        <span class="stop-name">{stop.name}</span>
                    </span>
                    <AccessibilityIcon
                        wheelchairBoarding={stop.wheelchair_boarding}
                    />
                </button>
            </li>
        {/each}
    </ol>
</div>

<style>
    .stop-list {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        position: relative;
        overflow: hidden;

        width: 100%;

        background-color: var(--surface);
        border-radius: var(--border-radius);
        border: var(--border-primary);

        --circle-radius: 7px;
        --line-width: 20px;
    }

    ol {
        list-style: none;
        padding: 0;
        margin: 0 0 0 calc(var(--line-width) / 2 - var(--circle-radius));
        width: 100%;
    }

    .line-visual {
        position: absolute;
        top: 0;
        bottom: 0;
        width: var(--line-width);
        border-radius: 0 var(--border-radius) var(--border-radius) 0;
        background-color: var(--line-color);
    }

    li {
        border-bottom: var(--border-primary);
    }

    li:last-child {
        border-bottom: none;
    }

    button {
        background: none;

        display: flex;
        align-items: center;
        gap: 2em;
        justify-content: space-between;

        padding: 0.6em 0;
        border: 0;
        padding-right: 1em;
        width: 100%;

        color: var(--fg-primary);
    }

    button:focus,
    button:hover {
        background-color: var(--line-color);
        color: white;
    }

    .stop-left {
        display: flex;
        align-items: center;
    }

    .stop-circle {
        content: "";
        background-color: white;
        border-radius: 50%;
        width: calc(2 * var(--circle-radius));
        height: calc(2 * var(--circle-radius));
        flex-shrink: 0;
        margin-right: 1.6em;
        z-index: 1;
    }

    .stop-name {
        font-size: var(--font-size-m);
        text-align: left;
    }
</style>
