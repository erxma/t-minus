<script lang="ts">
    import "$lib/global.css";
    import "./alerts.css";
    import { ChevronDown } from "@lucide/svelte";

    import type { AlertResource } from "@t-minus/shared";
    import { Accordion } from "bits-ui";
    import AlertIcon from "./common/AlertIcon.svelte";

    interface Props {
        alerts: AlertResource[];
    }

    const { alerts }: Props = $props();
</script>

<Accordion.Root type="multiple">
    {#each alerts as alert}
        <Accordion.Item>
            <Accordion.Header>
                <Accordion.Trigger>
                    <AlertIcon size="32" />
                    <div>{alert.header}</div>
                    <span><ChevronDown size="32" /></span>
                </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Content>
                <div class="content-inner">
                    {#if alert.image}
                        <img
                            src={alert.image}
                            alt={alert.image_alternative_text}
                        />
                    {/if}
                </div>
            </Accordion.Content>
        </Accordion.Item>
    {/each}
</Accordion.Root>

<style>
    img {
        width: 100%;
        max-width: 840px;
        border-radius: var(--border-radius);
    }

    .content-inner {
        padding: 16px;
        display: flex;
        align-items: center;
        flex-direction: column;
    }
</style>
