<script lang="ts">
    import "$lib/global.css";
    import ThemeToggle from "./ThemeToggle.svelte";
</script>

<header>
    <h1>
        <span aria-hidden="true">⊥</span>
        <span class="visually-hidden">T-Minus</span>
    </h1>

    <ThemeToggle />
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

    h1 {
        margin: 0;
    }
</style>
