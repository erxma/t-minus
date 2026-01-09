<script lang="ts">
    import "$lib/global.css";
    import { RouteType, type RouteResource } from "@t-minus/shared";

    interface Props {
        route: RouteResource;
        /**
         * If `true`, an abbreviated form of the route name is used,
         * e.g. "RL" instead of "Red Line", "GL (B)" instead of "Green Line B".
         * Otherwise, the full "long name" is used.
         *
         * Defaults to `false`.
         */
        abbreviate?: boolean;
        /**
         * The color expected to be underneath the pill.
         * Used to fake "carve-out" portions of the graphic.
         *
         * Defaults to the primary background.
         */
        colorUnderneath?: string;
        size?: number | string;
    }

    let {
        route,
        abbreviate = false,
        colorUnderneath = "var(--bg-primary)",
        size = "var(--font-size-l)",
    }: Props = $props();

    let lineMainName = $derived.by(() => {
        if (route.type_ === RouteType.BUS) {
            return route.short_name;
        }

        if (abbreviate) {
            if (route.id.startsWith("Green")) {
                return "GL";
            }
            switch (route.id) {
                case "Red":
                    return "RL";
                case "Mattapan":
                    return "M";
                case "Orange":
                    return "OL";
                case "Blue":
                    return "BL";
                default:
                    return route.long_name![0];
            }
        } else if (route.id.startsWith("Green")) {
            return "Green Line";
        } else {
            return route.long_name;
        }
    });

    let branch = $derived(
        route.id.startsWith("Green")
            ? route.id.substring(route.id.indexOf("-") + 1)
            : undefined,
    );
</script>

<span
    class="route-pill"
    aria-label={route.long_name}
    style:--color-underneath={colorUnderneath}
    style:--size={size}
    style:--text-color="#{route.text_color ?? '111'}"
>
    <!-- Colored background pill with line main name inside -->
    <!-- Special case for Mattapan "M" - use a circle shape instead -->
    <span
        class={["line", lineMainName === "M" && "circle"]}
        style:background-color="#{route.color ?? '000'}"
        ><b>{lineMainName}</b></span
    >
    <!-- If there's a branch name, add it in additional shape to the side -->
    <!-- Fakes carving out the main name shape, using background-color -->
    {#if branch}
        <span class="branch" style:background-color="#{route.color ?? '000'}"
            ><b>{branch}</b></span
        >
    {/if}
</span>

<style>
    .route-pill {
        display: flex;
        font-size: var(--size);
        height: 1.6em;
        color: var(--text-color);
    }

    .route-pill > span {
        text-align: center;
        align-content: center;
        border-radius: calc(infinity * 1px);
        white-space: nowrap;
    }

    .line {
        padding: 0 0.8em;
    }

    .line.circle {
        padding: 0;
        aspect-ratio: 1/1;
    }

    .branch {
        position: relative;
        right: 0.3em;
        aspect-ratio: 1/1;

        outline: 4px solid var(--color-underneath);
    }
</style>
