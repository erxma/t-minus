<script lang="ts">
    import "$lib/global.css";
    import type { RouteResource, TripResource } from "@t-minus/shared";

    interface Props {
        trip: TripResource;
        route: RouteResource;
        size?: number | string;
    }

    let { trip, route, size = "var(--font-size-l)" }: Props = $props();
</script>

<span
    class="cr-trip-pill"
    style:font-size={size}
    style:background-color="#{route.color ?? '000'}"
    style:color="#{route.text_color ?? 'fff'}"
>
    <b>{trip.name}</b>
</span>

<style>
    .cr-trip-pill {
        border-radius: 8px;
        padding: 3px 0.5em;
    }
</style>
