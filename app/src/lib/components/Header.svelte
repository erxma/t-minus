<script lang="ts">
    import { browser } from "$app/environment";
    import "$lib/global.css";
    import ThemeToggle from "./ThemeToggle.svelte";
</script>

<header>
    <nav class="left">
        <h1>
            <span aria-hidden="true">⊥</span>
            <span class="visually-hidden">T-Minus</span>
        </h1>
        <a href="/">Home</a>
        <a href="/map">Map (WIP)</a>
    </nav>

    {#if browser}
        <ThemeToggle />
    {/if}
</header>

<style>
    header {
        position: sticky;
        top: 0;
        z-index: var(--z-index-header);
        padding: 4px 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;

        background-color: var(--surface);
    }

    nav {
        display: inline-flex;
        align-items: center;
        gap: 1.4em;

        font-size: var(--font-size-l);
        font-weight: bold;
    }

    a:link {
        text-decoration-line: none;
    }

    a:hover {
        text-decoration: underline 2px;
        text-underline-offset: 5px;
    }

    a:visited {
        color: var(--fg-primary);
    }

    h1 {
        margin: 0;
    }
</style>
