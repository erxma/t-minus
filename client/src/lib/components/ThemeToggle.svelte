<script lang="ts">
    import "./theme-toggle.css";

    import { Moon, Sun } from "@lucide/svelte";
    import { Switch } from "bits-ui";
    import { onMount } from "svelte";

    let darkModeOn = $state(false);
    let theme = $derived(darkModeOn ? "dark" : "light");

    onMount(() => {
        // Initial check for theme based on client
        if (localStorage !== undefined && localStorage.getItem("theme")) {
            let storedTheme = localStorage.getItem("theme")!;
            darkModeOn = storedTheme === "dark";
        } else {
            darkModeOn = window.matchMedia(
                "(prefers-color-scheme: dark)",
            ).matches;
        }
    });

    $effect(() => {
        localStorage.setItem("theme", theme);
        if (theme === "dark") {
            document.documentElement.classList.add("dark");
        } else {
            document.documentElement.classList.remove("dark");
        }
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
