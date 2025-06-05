<script lang="ts">
    import { CircleAlert } from "@lucide/svelte";

    interface Props {
        size?: string;
    }

    const { size = "24" }: Props = $props();
</script>

<span class="alert-icon">
    <span aria-hidden="true">
        <CircleAlert color="black" fill="var(--text-warning)" {size} />
    </span>
    <span class="visually-hidden">Alert active</span>
</span>

<style>
    span {
        display: inline-flex;
        align-items: center;
    }
</style>
