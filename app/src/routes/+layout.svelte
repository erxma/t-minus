<script lang="ts">
    import Header from "$lib/components/Header.svelte";
    let { children } = $props();
</script>

<svelte:head>
    <title>T-Minus</title>
    <script>
        // Initialize theme:
        // Look for existing stored theme preference
        var theme = localStorage.getItem("theme");
        // If none, default to media query result
        if (!theme) {
            theme = window.matchMedia("(prefers-color-scheme: dark)").matches
                ? "dark"
                : "light";
        }

        // Toggle the dark class accordingly
        document.documentElement.classList.toggle("dark", theme === "dark");
        // Store the chosen theme
        localStorage.setItem("theme", theme);
    </script>
</svelte:head>

<Header />

{@render children()}
