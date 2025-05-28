<script lang="ts">
    import "$lib/global.css";

    import Header from "$lib/components/Header.svelte";
    import Loading from "$lib/components/common/Loading.svelte";
    import RoutePatternSelect from "$lib/components/route/RoutePatternSelect.svelte";
    import StopList from "$lib/components/route/StopList.svelte";
    import StopInfo from "$lib/components/StopInfo.svelte";
    import { Drawer } from "vaul-svelte";
    import { fade } from "svelte/transition";

    import {
        type PredictionResource,
        type RouteResource,
        type ScheduleResource,
        type StopResource,
    } from "@t-minus/shared";

    interface Props {
        routeOptions: RouteResource[];
        selectedRoute: RouteResource;
        selectedDirectionId: number;
        routeStops: StopResource[] | Promise<StopResource[]>;
        selectedStop: StopResource | undefined;
        arrivals: Promise<
            | readonly Readonly<PredictionResource>[]
            | readonly Readonly<ScheduleResource>[]
            | undefined
        >;
    }

    let {
        routeOptions,
        selectedRoute = $bindable(),
        selectedDirectionId = $bindable(),
        routeStops,
        selectedStop = $bindable(),
        arrivals,
    }: Props = $props();

    // (Can't be $derived because relation with selectedStop is two-way)
    let drawerOpen: boolean = $state(false);

    function setSelectedStop(value?: StopResource) {
        selectedStop = value;
        // If selecting a stop, open the drawer
        if (selectedStop) {
            drawerOpen = true;
        }
    }

    function setDrawerOpen(value: boolean) {
        drawerOpen = value;
        // If closing drawer, deselect stop
        if (!drawerOpen) {
            selectedStop = undefined;
        }
    }
</script>

<Header />
<main>
    <div class="route-view" in:fade>
        <RoutePatternSelect
            {routeOptions}
            bind:selectedRoute
            bind:selectedDirectionId
        />
        {#await routeStops}
            <Loading />
        {:then stops}
            <div class="route-stop-select" in:fade>
                <StopList
                    route={selectedRoute}
                    {stops}
                    onSelectStop={setSelectedStop}
                />
            </div>
        {:catch}
            <p>Failed to get list of stops on route.</p>
        {/await}
    </div>

    <Drawer.Root
        shouldScaleBackground
        bind:open={() => drawerOpen, setDrawerOpen}
    >
        <Drawer.Portal>
            <Drawer.Overlay class="drawer-overlay-default" />
            <Drawer.Content class="drawer-content-default">
                <Drawer.Close class="drawer-close-default"
                    ><div class="drawer-handle"></div></Drawer.Close
                >
                <!-- If there's a selected stop (there should be when drawer is open) -->
                {#if selectedStop}
                    <!-- Get list of expected arrivals -->
                    {#await arrivals}
                        <!-- Before arrivals are available, show with none -->
                        <StopInfo stop={selectedStop} route={selectedRoute} />
                    {:then arrivals}
                        <!-- Show with the arrivals -->
                        <StopInfo
                            stop={selectedStop}
                            route={selectedRoute}
                            {arrivals}
                        />
                    {/await}
                {/if}
            </Drawer.Content>
        </Drawer.Portal>
    </Drawer.Root>
</main>

<style>
    main {
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .route-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 480px;
        width: 100%;
    }

    .route-stop-select {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .drawer-handle {
        border-radius: calc(infinity * 1px);
        border: none;
        background-color: var(--fg-primary);
        height: 8px;
        width: 48px;
        margin: 4px 0;
    }
</style>
