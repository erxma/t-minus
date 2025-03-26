<script lang="ts">
    import "./global.css";

    import StopInfo from "./lib/components/StopInfo.svelte";
    import { Drawer } from "vaul-svelte";
    import Header from "./lib/components/Header.svelte";
    import type { RouteResource, StopResource } from "@t-minus/shared";
    import RouteView from "./lib/components/route/RouteView.svelte";
    import { fetchExpectedTimesForStop } from "@t-minus/shared";
    import { apiClient } from "./lib/components/api-client";

    let selectedRoute: RouteResource | undefined = $state();
    let selectedStop: StopResource | undefined = $state();
    let drawerOpen: boolean = $state(false);

    $effect(() => {
        if (selectedStop) {
            drawerOpen = true;
        }
    });
</script>

<Header />
<main>
    <RouteView bind:selectedRoute bind:selectedStop />
    <Drawer.Root shouldScaleBackground bind:open={drawerOpen}>
        <Drawer.Portal>
            <Drawer.Overlay class="drawer-overlay-default" />
            <Drawer.Content class="drawer-content-default">
                <Drawer.Close class="drawer-close-default"
                    ><div class="drawer-handle"></div></Drawer.Close
                >
                <StopInfo
                    stop={selectedStop!}
                    expectedArrivals={fetchExpectedTimesForStop(
                        apiClient,
                        selectedStop!.id!,
                        selectedRoute!.id,
                    )}
                    route={selectedRoute!}
                />
            </Drawer.Content>
        </Drawer.Portal>
    </Drawer.Root>
</main>

<style>
    main {
        margin: 0 1em 32px 1em;
        display: flex;
        flex-direction: column;
        align-items: center;
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
