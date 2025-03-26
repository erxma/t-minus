<script lang="ts">
    import "@/global.css";
    import { Accessibility, Slash } from "@lucide/svelte";

    interface Props {
        wheelchairBoarding?: 0 | 1 | 2;
        size?: string;
    }

    let { wheelchairBoarding, size = "20" }: Props = $props();
</script>

<span class="accessibility">
    {#if wheelchairBoarding === undefined || wheelchairBoarding === 0}
        <span aria-hidden="true">?</span><span class="visually-hidden"
            >No wheelchair boarding information</span
        >
    {:else if wheelchairBoarding === 1}
        <span class="accessible" aria-hidden="true">
            <Accessibility color="white" {size} />
        </span>

        <span class="visually-hidden">Accessible stop</span>
    {:else}
        <span class="inaccessible" aria-hidden="true">
            <Accessibility color="var(--fg-primary)" {size} />
            <span class="icon-crossout">
                <Slash color="var(--fg-primary)" {size} />
            </span>
        </span>
        <span class="visually-hidden">Inaccessible stop</span>
    {/if}
</span>

<style>
    .accessible {
        padding: 0.2em;
        background-color: #0076ff;
        border-radius: 6px;
        display: inline-flex;
    }

    .inaccessible {
        padding: 0.2em;
        background-color: var(--muted);
        border-radius: 6px;
        display: inline-flex;
    }

    .icon-crossout {
        position: absolute;
    }
</style>
