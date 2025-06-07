import dayjs, { Dayjs } from "dayjs";
import timezone from "dayjs/plugin/timezone.js";
import invariant from "tiny-invariant";
import { RouteType, type SchedulesRequestParams } from "./mbta-api.js";
import type {
    AlertResource,
    InformedEntity,
    MbtaApiClient,
    PredictionResource,
    ScheduleResource,
    StopResource,
} from "./mbta-api.js";

dayjs.extend(timezone);

export type ArrivalResource = PredictionResource | ScheduleResource;

export async function fetchExpectedTimesForStop(
    client: MbtaApiClient,
    stopId: string,
    routeId?: string,
): Promise<(PredictionResource | ScheduleResource)[]> {
    // First, fetch all the available predictions for the stop.
    const predictionsResponse = await client.fetch("predictions", {
        sort: "time",
        filters: {
            stop: stopId,
            route: routeId,
            route_type: [RouteType.HEAVY_RAIL, RouteType.LIGHT_RAIL],
        },
        fields: {
            prediction: [
                "status",
                "arrival_time",
                "departure_time",
                "stop_sequence",
            ],
            vehicle: ["current_status", "current_stop_sequence", "carriages"],
            trip: ["headsign", "name"],
        },
        include: ["vehicle", "trip", "route"],
    });

    // Also get schedules from now until the time of the last prediction,
    // then a max number after that.
    const now = dayjs();
    const [nowServiceDay, nowServiceTime] = serviceDayAndTime(now);

    const lastPrediction = predictionsResponse.at(
        predictionsResponse.length - 1,
    );
    const lastPredictionTime = dayjs(
        lastPrediction?.arrival_time ?? lastPrediction?.departure_time ?? now,
    );

    const [_, lastPredServiceTime] = serviceDayAndTime(lastPredictionTime);

    let schedulesParams: SchedulesRequestParams = {
        sort: "time",
        filters: {
            stop: stopId,
            route: routeId,
            min_time: nowServiceTime,
            max_time: lastPredServiceTime,
            date: nowServiceDay,
            route_type: [RouteType.HEAVY_RAIL, RouteType.LIGHT_RAIL],
        },
        fields: {
            schedule: ["arrival_time", "departure_time"],
            trip: ["headsign", "name"],
        },
        include: ["trip", "prediction", "route"],
    };

    let coincidingSchedulesResponse = await client.fetch(
        "schedules",
        schedulesParams,
    );

    let afterSchedulesResponse = await fetchNextSchedules(
        client,
        stopId,
        lastPredictionTime,
        routeId,
    );

    // Consolidate the predictions and schedules
    const expectations = [
        ...mergePredictionsAndSchedules(
            predictionsResponse,
            coincidingSchedulesResponse,
        ),
        ...afterSchedulesResponse,
    ];

    return expectations;
}

export async function fetchNextSchedules(
    client: MbtaApiClient,
    stopId: string,
    minTime: Readonly<Dayjs>,
    routeId?: string,
    limit?: number,
    fetch?: typeof globalThis.fetch,
): Promise<readonly Readonly<ScheduleResource>[]> {
    const [minServiceDay, minServiceTime] = serviceDayAndTime(minTime);

    let schedulesParams: SchedulesRequestParams = {
        sort: "time",
        page: {
            limit: limit ?? 5,
        },
        filters: {
            stop: stopId,
            route: routeId,
            min_time: minServiceTime,
            date: minServiceDay,
            route_type: [RouteType.HEAVY_RAIL, RouteType.LIGHT_RAIL],
        },
        fields: {
            schedule: ["arrival_time", "departure_time"],
            trip: ["headsign", "name"],
        },
        include: ["trip", "prediction", "route", "stop"],
    };

    let afterSchedulesResponse = await client.fetch(
        "schedules",
        schedulesParams,
        fetch,
    );

    // If there are no results, that means there are no more trips scheduled
    // for the current service day.
    // So get a few from the start of the next service day instead.
    // (Could still be none for the whole day)
    if (afterSchedulesResponse.length === 0) {
        schedulesParams = {
            ...schedulesParams,
            filters: {
                ...schedulesParams.filters,
                min_time: "03:00",
                date: dayjs(minServiceDay).add(1, "day").format("YYYY-MM-DD"),
            },
        };
        afterSchedulesResponse = await client.fetch(
            "schedules",
            schedulesParams,
            fetch,
        );
    }

    return afterSchedulesResponse;
}

export function groupArrivalsByChildStop(
    arrivals: readonly ArrivalResource[],
): { stop: StopResource; arrivals: ArrivalResource[] }[] {
    const groups = new Map();

    for (const arrival of arrivals) {
        const platformId = arrival.stop!.id;
        if (!groups.has(platformId)) {
            groups.set(platformId, { stop: arrival.stop!, arrivals: [] });
        }
        groups.get(platformId).arrivals.push(arrival);
    }

    return Array.from(groups.values());
}

export function entityIsAffectedByAlert(
    entity: Partial<InformedEntity>,
    alert: AlertResource,
): boolean {
    invariant(alert.informed_entity !== undefined);
    // True if:
    // For some informed entity,
    // every key present in entity is either not present in the informed,
    // or the two have equal values.
    return alert.informed_entity.some((informed) =>
        Object.keys(entity).every(
            (key) =>
                !(key in informed) ||
                entity[key as keyof InformedEntity] ===
                    informed[key as keyof InformedEntity],
        ),
    );
}

/**
 * Get the day and time strings to use in queries to the API,
 * following the service day boundary rules:
 *
 * - "Trips that begin between midnight and 3am are considered part of the previous service day."
 * - "To filter times after midnight use more than 24 hours."
 */
function serviceDayAndTime(time: Readonly<Dayjs>): [day: string, time: string] {
    if (time.hour() < 3) {
        return [
            time.subtract(1, "day").format("YYYY-MM-DD"),
            `${time.hour() + 24}:${time.minute().toString().padStart(2, "0")}`,
        ];
    } else {
        return [time.format("YYYY-MM-DD"), time.format("HH:mm")];
    }
}

/**
 * Combine a list of predictions and a list of schedules by eliminating duplicate
 * arrivals between the two and overall sorting by time.
 */
function mergePredictionsAndSchedules(
    predictions: readonly Readonly<PredictionResource>[],
    schedules: readonly Readonly<ScheduleResource>[],
): (PredictionResource | ScheduleResource)[] {
    const schedsWithoutPreds = schedules.filter(
        (sched) => !predictions.some((pred) => pred.schedule?.id === sched.id),
    );

    const merged = [...predictions, ...schedsWithoutPreds].sort(
        (a, b) =>
            new Date(a.arrival_time ?? a.departure_time!).valueOf() -
            new Date(b.arrival_time ?? b.departure_time!).valueOf(),
    );

    return merged;
}
