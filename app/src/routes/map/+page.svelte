<script lang="ts">
    import { onMount } from "svelte";

    import "$lib/global.css";
    import "leaflet/dist/leaflet.css";

    let mapContainer: HTMLElement;

    onMount(() => {
        import("leaflet").then((L) => {
            const map = L.map(mapContainer).setView([42.351, -71.1], 12.3);

            L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: `<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors`,
            }).addTo(map);
        });
    });
</script>

<main>
    <div class="map-container">
        <div bind:this={mapContainer} class="map"></div>
        <div class="overlay">
            <div class="wip-sign">Work in progress</div>
        </div>
    </div>
</main>

<style>
    main {
        height: 100%;
    }

    .map-container {
        position: relative;
        height: 100%;
    }

    .map {
        height: 100%;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background-color: rgba(0, 0, 0, 0.7);
        z-index: 1000;

        display: flex;
        align-items: center;
        justify-content: center;
    }

    .wip-sign {
        background-color: var(--bg-primary);
        color: var(--fg-primary);
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        border-radius: 24px;

        padding: 20px;
        width: 70%;
    }
</style>
