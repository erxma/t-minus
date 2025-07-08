<script lang="ts">
    import "$lib/global.css";
    import { Accessibility, CircleHelp, Slash } from "@lucide/svelte";
    import { WheelchairAccessibility } from "@t-minus/shared";

    interface Props {
        wheelchairBoarding?: WheelchairAccessibility;
        size?: string;
    }

    let { wheelchairBoarding, size = "20" }: Props = $props();
</script>

<span class="accessibility">
    {#if wheelchairBoarding === undefined || wheelchairBoarding === WheelchairAccessibility.NO_INFO}
        <span class="icon" aria-hidden="true" style:--icon-bg="var(--muted)">
            <CircleHelp color="var(--fg-primary)" {size} />
        </span>
        <span class="visually-hidden">No wheelchair boarding information</span>
    {:else if wheelchairBoarding === WheelchairAccessibility.ACCESSIBLE}
        <span class="icon" aria-hidden="true" style:--icon-bg="#0076ff">
            <Accessibility color="white" {size} />
        </span>

        <span class="visually-hidden">Accessible stop</span>
    {:else}
        <span class="icon" aria-hidden="true" style:--icon-bg="var(--muted)">
            <Accessibility color="var(--fg-primary)" {size} />
            <span class="icon-crossout">
                <Slash color="var(--fg-primary)" {size} />
            </span>
        </span>
        <span class="visually-hidden">Inaccessible stop</span>
    {/if}
</span>

<style>
    .icon {
        padding: 0.2em;
        background-color: var(--icon-bg);
        border-radius: 6px;
        display: inline-flex;
    }

    .icon-crossout {
        position: absolute;
    }
</style>
