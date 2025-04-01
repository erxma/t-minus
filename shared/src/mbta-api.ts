import {
    buildUrlParams,
    flatten,
    JsonApiResource,
    type CollectionRequestParams,
} from "./json-api.js";

export interface StopsRequestParams {
    filters?: {
        route?: string;
        direction_id?: number;
    };
    fields?: {
        stop?: string[];
    };
    include?: string[];
}

export interface PredictionsRequestParams extends CollectionRequestParams {
    filters?: {
        latitude?: number;
        longitude?: number;
        radius?: number;
        direction_id?: 0 | 1;
        route_type?: RouteType | RouteType[];
        stop?: string | string[];
        route?: string | string[];
        trip?: string | string[];
        revenue?: RevenueStatus | RevenueStatus[];
    };
}

export interface RoutesRequestParams extends CollectionRequestParams {
    filters?: {
        stop?: string | string[];
        type?: (0 | 1 | 2 | 3 | 4) | (0 | 1 | 2 | 3 | 4)[];
        id?: string | string[];
    };
}

export interface SchedulesRequestParams extends CollectionRequestParams {
    filters?: {
        date?: string | string[];
        route_type?: (0 | 1 | 2 | 3 | 4) | (0 | 1 | 2 | 3 | 4)[];
        min_time?: string;
        max_time?: string;
        route?: string | string[];
        stop?: string | string[];
        trip?: string | string[];
        stop_sequence?: number | number[] | string | string[];
    };
}

export interface PredictionResource {
    type: "prediction";
    id: string;

    // Attributes
    update_type?: UpdateType;
    stop_sequence?: number | null;
    status?: string;
    schedule_relationship?: ScheduleRelationship | null;
    revenue_status?: RevenueStatus;
    direction_id?: 0 | 1;
    departure_uncertainty?: number | null;
    departure_time?: string | null;
    arrival_uncertainty?: number | null;
    arrival_time?: string | null;

    // Relationships
    vehicle?: VehicleResource;
    trip?: TripResource | null;
    stop?: StopResource;
    schedule?: ScheduleResource | null;
    route?: RouteResource | null;
}

export type UpdateType = "MID_TRIP" | "AT_TERMINAL" | "REVERSE_TRIP";

export type ScheduleRelationship =
    | "ADDED"
    | "CANCELLED"
    | "NO_DATA"
    | "SKIPPED"
    | "UNSCHEDULED";

export type RevenueStatus = "REVENUE" | "NON_REVENUE";

export interface RouteResource {
    type: "route";
    id: string;

    // Attributes
    type_: RouteType;
    text_color?: string;
    sort_order?: number;
    short_name?: string;
    long_name?: string;
    fare_class?: string;
    direction_names?: string[];
    direction_destinations?: string[];
    description?: string;
    color?: string;
}

export enum RouteType {
    LIGHT_RAIL = 0,
    HEAVY_RAIL = 1,
    COMMUTER_RAIL = 2,
    BUS = 3,
    FERRY = 4,
}

export interface ScheduleResource {
    type: "schedule";
    id: string;

    // Attributes
    timepoint?: boolean;
    stop_sequence?: number;
    stop_headsign?: string | null;
    pickup_type?: PickupType;
    drop_off_type?: DropOffType;
    direction_id?: 0 | 1;
    departure_time?: string;
    arrival_time?: string;

    // Relationships
    trip?: TripResource | null;
    stop?: StopResource | null;
    route?: RouteResource | null;
    prediction?: PredictionResource | null;
}

export const PickupType = {
    REGULARLY_SCHEDULED: 0,
    NONE_AVAILABLE: 1,
    MUST_PHONE_AGENCY: 2,
    MUST_COORDINATE_WITH_DRIVER: 3,
} as const;
export type PickupType = (typeof PickupType)[keyof typeof PickupType];

export const DropOffType = {
    REGULARLY_SCHEDULED: 0,
    NONE_AVAILABLE: 1,
    MUST_PHONE_AGENCY: 2,
    MUST_COORDINATE_WITH_DRIVER: 3,
} as const;
export type DropOffType = (typeof DropOffType)[keyof typeof DropOffType];

export interface StopResource {
    type: "stop";
    id: string;

    wheelchair_boarding?: 0 | 1 | 2;
    name?: string;
    parent_station?: StopResource;
}

export interface TripResource {
    type: "trip";
    id: string;

    // Attributes
    wheelchair_accessible?: WheelchairAccessibility;
    revenue_status?: RevenueStatus;
    name?: string;
    headsign?: string;
    direction_id?: 0 | 1;
    block_id?: string;
    bikes_allowed?: 0 | 1 | 2;

    // Relationships
    route?: RouteResource | null;
}

export const WheelchairAccessibility = {
    NO_INFO: 0,
    ACCESSIBLE: 1,
    INACCESSIBLE: 2,
} as const;
export type WheelchairAccessibility =
    (typeof WheelchairAccessibility)[keyof typeof WheelchairAccessibility];

export const BikesAllowed = {
    NO_INFO: 0,
    ACCOMODATES_AT_LEAST_ONE: 1,
    NOT_ALLOWED: 2,
} as const;
export type BikesAllowed = (typeof BikesAllowed)[keyof typeof BikesAllowed];

export interface VehicleResource {
    type: "vehicle";
    id: string;

    updated_at?: string;
    speed?: number;
    revenue_status?: string;
    occupancy_status?: OccupancyStatus | null;
    longitude?: number;
    latitude?: number;
    label?: string;
    direction_id?: 0 | 1;
    current_stop_sequence?: number;
    current_status?: VehicleStatus;
    carriages?: {
        label: string;
        occupancy_status: OccupancyStatus;
        bearing: number;
    }[];

    trip?: TripResource | null;
    stop?: StopResource | null;
    route?: RouteResource | null;
}

export type OccupancyStatus =
    | "MANY_SEATS_AVAILABLE"
    | "FEW_SEATS_AVAILABLE"
    | "STANDING_ROOM_ONLY"
    | "CRUSHED_STANDING_ROOM_ONLY"
    | "FULL"
    | "NOT_ACCEPTING_PASSENGERS"
    | "NO DATA_AVAILABLE";

export type VehicleStatus = "INCOMING_AT" | "STOPPED_AT" | "IN_TRANSIT_TO";

type MbtaApiEndpoint<ReqParams, Res> = {
    requestParams: ReqParams;
    resource: Res;
};

// Each corresponds to the endpoint of the same name of the API.
type MbtaApiEndpoints = {
    stops: MbtaApiEndpoint<StopsRequestParams, StopResource>;
    predictions: MbtaApiEndpoint<PredictionsRequestParams, PredictionResource>;
    routes: MbtaApiEndpoint<RoutesRequestParams, RouteResource>;
    schedules: MbtaApiEndpoint<SchedulesRequestParams, ScheduleResource>;
};

type EndpointPath = keyof MbtaApiEndpoints;

/**
 * Handlers for all events that the streaming API may send,
 * plus the error case.
 */
export interface MbtaApiEventListeners<Res> {
    onReset?: (resources: Res[]) => void;
    onAdd?: (added: Res) => void;
    onUpdate?: (updated: Res) => void;
    onRemove?: (removedId: string) => void;
    onError: (err: Error) => void;
}

export class MbtaApiClient {
    baseUrl: string;
    apiKey?: string;

    constructor(baseUrl: string, apiKey?: string) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    /**
     * Make a call for a one-time fetch of the given `resource` with `params` in the request.
     * @returns If successful, an array of the corresponding resources, flattened from the raw response.
     */
    public async fetch<Path extends EndpointPath>(
        path: Path,
        params: MbtaApiEndpoints[Path]["requestParams"],
    ): Promise<MbtaApiEndpoints[Path]["resource"][]> {
        // Build request URL
        const urlParams = buildUrlParams(params);
        const url = `${this.baseUrl}/${path}?${new URLSearchParams(urlParams)}`;

        // Make the API call
        const response = await fetch(url, {
            headers: {
                ...(this.apiKey && { "X-API-Key": this.apiKey }),
            },
        });
        // If response not OK, throw
        if (!response.ok) {
            throw new Error(
                `MBTA API query failed. Response status: ${response.status}`,
            );
        }
        // Parse JSON
        const json = await response.json();

        // Flatten and return
        const flattened = flatten(json);
        return flattened as MbtaApiEndpoints[Path]["resource"][];
    }

    public listen<Path extends EndpointPath>(
        path: Path,
        params: MbtaApiEndpoints[Path]["requestParams"],
        listeners: MbtaApiEventListeners<MbtaApiEndpoints[Path]["resource"]>,
    ): EventSource {
        type Resource = MbtaApiEndpoints[Path]["resource"];

        // Build request URL
        const urlParams = buildUrlParams(params);
        // If a key is set, add it as a URL param;
        // A key is required for streaming the MBTA API,
        // so it must be added to the request at some point down the line
        if (this.apiKey) {
            urlParams["api_key"] = this.apiKey;
        }
        const url = `${this.baseUrl}/${path}?${new URLSearchParams(urlParams)}`;

        // Start listening
        const eventSource = new EventSource(url, {
            withCredentials: true,
        });

        // On event, parse and flatten, then hand off
        // to the corresponding passed in handler
        eventSource.addEventListener("reset", (msg) => {
            const flattened = flattenStreamed(
                JSON.parse(msg.data),
                // The API uses plural for the endpoints, but singular
                // for the "type"...technically not compliant with JSON:API.
                // Just strip off the "s".
                path.substring(0, path.length - 1),
            ) as Resource[];
            listeners.onReset?.(flattened);
        });
        eventSource.addEventListener("add", (msg) => {
            const flattened = flatten(JSON.parse(msg.data)) as Resource;
            listeners.onAdd?.(flattened);
        });
        eventSource.addEventListener("update", (msg) => {
            const flattened = flatten(JSON.parse(msg.data)) as Resource;
            listeners.onUpdate?.(flattened);
        });
        eventSource.addEventListener("remove", async (msg) => {
            const flattened = JSON.parse(msg.data) as { id: string };
            listeners.onRemove?.(flattened.id);
        });

        eventSource.onerror = (err) => {
            listeners.onError(
                new Error(`Failure in server-sent event stream: ${err}`),
            );
        };

        // Return the EventSource (most importantly, so it can be closed)
        return eventSource;
    }
}

/**
 * Flatten the data from a streamed `"reset"` event.
 * A separate function is needed since it's in the format of
 * a single flat array with the primary resources and the includes.
 *
 * @param primaryType The `"type"` of the primary resource,
 * i.e. the directly requested type; the rest are includes.
 */
function flattenStreamed(
    msgData: JsonApiResource[],
    primaryType: string,
): object[] {
    // Split the resources into the primary ones ("data") and the included
    const data = msgData.filter((res) => res.type === primaryType);
    const included = msgData.filter((res) => res.type !== primaryType);
    return flatten({ data, included }) as object[];
}
