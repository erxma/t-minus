<script lang="ts">
    import "./theme-toggle.css";

    import { Moon, Sun } from "@lucide/svelte";
    import { Switch } from "bits-ui";
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

<Switch.Root bind:checked={darkModeOn} class="switch-root">
    <Switch.Thumb class="switchThumb">
        {#if darkModeOn}
            <Moon />
        {:else}
            <Sun />
        {/if}
        <span class="visually-hidden">Enable dark mode</span>
    </Switch.Thumb>
</Switch.Root>
