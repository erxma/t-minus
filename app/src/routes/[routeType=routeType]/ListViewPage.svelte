<script lang="ts">
    import "$lib/global.css";

    import Loading from "$lib/components/common/Loading.svelte";
    import RoutePatternSelect from "$lib/components/route/RoutePatternSelect.svelte";
    import StopList from "$lib/components/route/StopList.svelte";
    import StopInfo from "$lib/components/StopInfo.svelte";
    import { Drawer } from "vaul-svelte";
    import { fade } from "svelte/transition";

    import {
        type AlertResource,
        type PredictionResource,
        type RoutePatternResource,
        type RouteResource,
        type ScheduleResource,
        type StopResource,
    } from "@t-minus/shared";
    import { Milestone } from "@lucide/svelte";
    import { isLargeScreen } from "$lib/util/media.svelte";

    interface Props {
        routeOptions: RouteResource[];
        selectedRoute: RouteResource;
        selectedDirectionId: number;
        selectedRoutePattern: RoutePatternResource;
        routeStops: StopResource[] | Promise<StopResource[]>;
        selectedStop: StopResource | undefined;
        arrivals: Promise<
            | readonly Readonly<PredictionResource>[]
            | readonly Readonly<ScheduleResource>[]
            | undefined
        >;
        alerts: readonly Readonly<AlertResource>[] | undefined;
    }

    let {
        routeOptions,
        selectedRoute = $bindable(),
        selectedDirectionId = $bindable(),
        selectedRoutePattern = $bindable(),
        routeStops,
        selectedStop = $bindable(),
        arrivals,
        alerts,
    }: Props = $props();

    // (Can't be $derived because relation with selectedStop is two-way)
    let drawerOpen: boolean = $state(false);

    // Using $effect here as selectedStop could be changed by parent
    $effect(() => {
        // Open drawer if selecting a stop, close if deselecting
        drawerOpen = selectedStop !== undefined;
    });

    function setDrawerOpen(value: boolean) {
        drawerOpen = value;
        // If closing drawer, deselect stop
        if (!drawerOpen) {
            selectedStop = undefined;
        }
    }
</script>

<main>
    <div class="route-view scroll-container" in:fade>
        <RoutePatternSelect
            {routeOptions}
            bind:selectedRoute
            bind:selectedDirectionId
            bind:selectedRoutePattern
        />
        {#await routeStops}
            <Loading />
        {:then stops}
            <div class="stop-list" in:fade>
                <StopList
                    route={selectedRoute}
                    {stops}
                    onSelectStop={(stop) => (selectedStop = stop)}
                />
            </div>
        {:catch}
            <p>Failed to get list of stops on route.</p>
        {/await}
    </div>

    {#snippet stopViewContent()}
        <!-- If there's a selected stop -->
        <!-- When using drawer, there always should be -->
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
                    {alerts}
                />
            {/await}
        {/if}
    {/snippet}

    <!-- On large screens, show to the side; on small, use drawer -->
    <div class="side-info-panel">
        {#if isLargeScreen() && selectedStop}
            {@render stopViewContent()}
        {:else}
            <div class="small-message">
                <Milestone
                    size={48}
                    color="var(--fg-primary)"
                    aria-hidden="true"
                />
                <p>Select a stop for more info.</p>
            </div>
        {/if}
    </div>

    {#if !isLargeScreen()}
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
                    {@render stopViewContent()}
                </Drawer.Content>
            </Drawer.Portal>
        </Drawer.Root>
    {/if}
</main>

<style>
    main {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .route-view {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 480px;
        width: 100%;
        padding: 0 12px 12px 12px;
    }

    .stop-list {
        display: flex;
        flex-direction: column;
        width: 100%;
    }

    .side-info-panel {
        display: none;
    }

    @media (min-width: 1024px) {
        main {
            height: 100%;
            min-height: 0;
        }
        .route-view {
            height: 100%;
            overflow-y: auto;
            overflow-x: clip;
            padding: 0 24px 0 36px;
        }
        .side-info-panel {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100%;
            width: 100%;
        }
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
