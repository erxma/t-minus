<script lang="ts">
    import "$lib/global.css";
    import { ChevronDown } from "@lucide/svelte";

    import type { AlertResource } from "@t-minus/shared";
    import AlertIcon from "./common/AlertIcon.svelte";
    import { Accordion } from "melt/builders";
    import { slide } from "svelte/transition";

    interface Props {
        alerts: AlertResource[];
    }

    const { alerts }: Props = $props();

    const sortedAlerts = $derived(
        alerts.toSorted((a, b) => b.severity! - a.severity!),
    );

    function hasDetails(alert: AlertResource): boolean {
        return alert.image !== null;
    }

    const accordion = new Accordion();
</script>

<div {...accordion.root} class="accordion-root">
    {#each sortedAlerts as alert (alert.id)}
        {@const item = accordion.getItem({ id: alert.id })}
        <div class="accordion-item">
            <div {...item.heading}>
                <button
                    {...item.trigger}
                    disabled={!hasDetails(alert)}
                    class="accordion-trigger"
                >
                    <div class="trigger-left">
                        <AlertIcon size="32" />
                        <div>{alert.header}</div>
                    </div>
                    {#if hasDetails(alert)}
                        <div class="trigger-right">
                            <ChevronDown size="32" />
                        </div>
                    {/if}
                </button>
            </div>

            {#if item.isExpanded}
                <div
                    {...item.content}
                    class="alerts-accordion-content"
                    transition:slide
                >
                    <div class="content-inner">
                        {#if alert.image}
                            <img
                                src={alert.image}
                                alt={alert.image_alternative_text}
                            />
                        {/if}
                    </div>
                </div>
            {/if}
        </div>
    {/each}
</div>

<style>
    .accordion-root {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .accordion-trigger {
        display: flex;
        align-items: center;
        justify-content: space-between;

        width: 100%;
        border: none;
        padding: 12px;

        font-size: var(--font-size-m);
        text-align: left;
        color: var(--fg-primary);
        background-color: var(--bg-warning);
    }

    .accordion-trigger:disabled {
        cursor: default;
    }

    .accordion-item {
        border: var(--border-primary);
        border-radius: var(--border-radius);
        overflow: hidden;
    }

    img {
        width: 100%;
        max-width: 840px;
        border-radius: var(--border-radius);
    }

    .trigger-left,
    .trigger-right {
        display: inline-flex;
        align-items: center;
        gap: 0.8em;
    }

    .content-inner {
        padding: 16px;
        display: flex;
        align-items: center;
        flex-direction: column;
    }
</style>
