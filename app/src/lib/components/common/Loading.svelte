<script lang="ts">
    import { fade } from "svelte/transition";
</script>

<div in:fade={{ delay: 400 }}></div>

<style>
    div {
        width: 48px;
        height: 48px;
        margin: 1em;
        align-self: center;
        border: 5px solid;
        border-color: var(--fg-primary) transparent;
        border-radius: 50%;
        display: inline-block;
        box-sizing: border-box;
        animation: rotation 1s linear infinite;
    }

    @keyframes rotation {
        0% {
            transform: rotate(0deg);
        }

        100% {
            transform: rotate(360deg);
        }
    }
</style>
