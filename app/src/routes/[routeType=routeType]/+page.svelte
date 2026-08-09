<script lang="ts">
    import "$lib/global.css";
    import type { PageProps } from "./$types";
    import RoutePill from "$lib/components/common/RoutePill.svelte";

    let { data }: PageProps = $props();
</script>

<main>
    <h1>{data.heading}</h1>
    <ul class="pill-list" style:--item-width={data.itemWidth}>
        {#each data.routeOptions as route}
            <li>
                <a href="/{data.routeType}/{route.id}">
                    <RoutePill {route} />
                </a>
            </li>
        {/each}
    </ul>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .pill-list {
        display: grid;
        grid-template-columns: repeat(
            auto-fit,
            minmax(max(var(--item-width), 100% / 5), 1fr)
        );
        gap: 1rem;
        justify-items: center;

        padding: 0 1rem;
        width: 100%;
        max-width: 1000px;

        list-style: none;
    }

    a {
        display: inline-flex;
        text-decoration: none;
        color: inherit;
        padding: 6px;
        box-sizing: border-box;
        border-radius: var(--border-radius);
    }

    a:hover,
    a:active {
        outline: 2px solid var(--fg-primary);
    }
</style>
