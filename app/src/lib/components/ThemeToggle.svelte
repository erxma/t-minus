<script lang="ts">
    import { Moon, Sun } from "@lucide/svelte";
    import { onMount } from "svelte";

    export const ssr = false;

    let darkModeOn = $state(false);
    let theme = $derived(darkModeOn ? "dark" : "light");

    onMount(() => {
        // Get the stored theme preference, which should have initialized
        // by header inline script
        let storedTheme = localStorage.getItem("theme")!;
        darkModeOn = storedTheme === "dark";
    });

    $effect(() => {
        // Update the stored theme when changed
        localStorage.setItem("theme", theme);
        // Toggle the dark class accordingly
        document.documentElement.classList.toggle("dark", theme === "dark");
    });
</script>

<button
    role="switch"
    aria-checked={darkModeOn}
    class="switch-root"
    onclick={() => (darkModeOn = !darkModeOn)}
>
    <span class="switch-thumb">
        {#if darkModeOn}
            <Moon />
        {:else}
            <Sun />
        {/if}
        <span class="visually-hidden">Enable dark mode</span>
    </span>
</button>

<style>
    .switch-root {
        position: relative;
        display: inline-flex;
        align-items: center;
        width: 60px;
        height: 36px;
        border-radius: calc(infinity * 1px);
        padding-left: 3px;
        padding-right: 3px;

        background-color: var(--button-color);
        border: var(--border-primary);
    }

    .switch-thumb {
        width: 30px;
        height: 30px;
        border-radius: calc(infinity * 1px);
        background-color: var(--bg-primary);
        color: var(--fg-primary);

        display: inline-flex;
        align-items: center;
        justify-content: center;
    }

    .switch-root[aria-checked="true"] > .switch-thumb {
        translate: 24px;
    }
</style>
