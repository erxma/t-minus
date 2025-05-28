import {
    flattenResource,
    type JsonApiResource,
    type ResourceIdentifier,
} from "@t-minus/shared/json-api";
import invariant from "tiny-invariant";

/**
 * A collection of MBTA API resources being updated live through streaming events.
 * Updates to includes will be reflected as well.
 *
 * `close()` should be called once no longer needed.
 */
// API docs say that includes are not tracked for updates,
// but this seems to no longer be the case.
// So this is starting to look a lot like a DB.
// TODO: Consider using something like Dexie for local DB?
// If used across views, would need to think about issue of stale data.

export class MbtaStreamedCollection<R extends ResourceIdentifier> {
    /**
     * Comparison function that the data should be sorted by when read.
     */
    orderCmp: (a: Readonly<R>, b: Readonly<R>) => number;
    /**
     * Handler for when the event source encounters an error.
     */
    onError?: (err: Error) => void;

    /** The expected "type" field for the primary data resources in this collection. */
    // TODO: This and resource type are associated
    // TODO: Likely issues if there are includes of same type
    private readonly primaryType: string;
    /** The main resources being tracked (which includes would not be) */
    private _primaryData?: JsonApiResource[] = $state();
    /** Any resources included as relationships for the primary resources. */
    private _included?: JsonApiResource[] = $state();
    /** The EventSource for the API's SSEs. */
    private readonly eventSource: EventSource;

    constructor(
        type: string,
        eventSource: EventSource,
        orderCmp: (a: Readonly<R>, b: Readonly<R>) => number,
    ) {
        // Store these fields as is
        this.primaryType = type;
        this.orderCmp = orderCmp;
        this.eventSource = eventSource;

        // Data arrays are undefined before first reset
        this._primaryData = undefined;
        this._included = undefined;

        // Add event handlers
        eventSource.addEventListener("reset", (msg) => this.onReset(msg));
        eventSource.addEventListener("add", (msg) => this.onAdd(msg));
        eventSource.addEventListener("update", (msg) => this.onUpdate(msg));
        eventSource.addEventListener("remove", (msg) => this.onRemove(msg));

        eventSource.onerror = (err) => {
            this.onError?.(
                new Error(`Failure in server-sent event stream: ${err}`),
            );
        };
    }

    /** The contained data, flattened and denomalized,
     * and sorted by the order specified for this collection.
     */
    get data(): readonly Readonly<R>[] | undefined {
        return this._primaryData
            ?.map((res) => flattenResource(res, this._included) as R)
            .sort(this.orderCmp);
    }

    /** Close the connection listening for API server events. */
    close() {
        this.eventSource.close();
    }

    /** Handler for API `reset` event. */
    private onReset(event: MessageEvent) {
        // Parse payload: a single array of resources, mixing primaries and includes.
        const msgData = JSON.parse(event.data) as JsonApiResource[];

        // Split the array into the primaries and includes, store them.
        this._primaryData = msgData.filter(
            (res) => res.type === this.primaryType,
        );
        this._included = msgData.filter((res) => res.type !== this.primaryType);
    }

    /** Handler for API `add` event. */
    private onAdd(event: MessageEvent) {
        invariant(this._primaryData !== undefined);
        invariant(this._included !== undefined);

        // Parse payload: a single resource being added.
        const added = JSON.parse(event.data) as JsonApiResource;

        // Push to appropriate array depending on type
        if (added.type === this.primaryType) {
            this._primaryData.push(added);
        } else {
            this._included.push(added);
        }
    }

    /** Handler for API `update` event. */
    private onUpdate(event: MessageEvent) {
        invariant(this._primaryData !== undefined);
        invariant(this._included !== undefined);

        // Parse payload: the new value of a single resource.
        const updated = JSON.parse(event.data) as JsonApiResource;

        // Look for the existing entry by ID in the array appropriate for the type
        let existingEntry;
        if (updated.type === this.primaryType) {
            existingEntry = this._primaryData.find(
                (res) => res.id === updated.id,
            );
        } else {
            // In includes, should also match type
            existingEntry = this._included.find(
                (res) => res.type === updated.type && res.id === updated.id,
            );
        }

        invariant(
            existingEntry !== undefined,
            `Resource being updated not found: ${updated.type} ${updated.id}`,
        );
        // Update the object in place
        Object.assign(existingEntry, updated);
    }

    /** Handler for API `remove` event. */
    private onRemove(event: MessageEvent) {
        invariant(this._primaryData !== undefined);
        invariant(this._included !== undefined);

        // Parse payload: type and ID of the single resource being removed
        const removed = JSON.parse(event.data) as ResourceIdentifier;

        // Remove from appropriate array depending on type
        if (removed.type === this.primaryType) {
            this._primaryData = this._primaryData.filter(
                (res) => res.id !== removed.id,
            );
        } else {
            // In includes, should also match type
            this._included = this._included.filter(
                (res) => res.type !== res.type || res.id !== removed.id,
            );
        }
    }
}
