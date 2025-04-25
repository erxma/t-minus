import dayjs from "dayjs";
import type { PredictionResource, ScheduleResource } from "@t-minus/shared";

/**
 * For a given prediction, get the text displaying the time remaining or other status
 */
export function predictionCountdownText(
    prediction: PredictionResource | undefined,
): string {
    // If no prediction available, show "No live prediction".
    if (!prediction) {
        return "No live prediction";
    }

    // If `status` is defined, display value as-is
    if (prediction.status) {
        return prediction.status;
    }

    // Calculate seconds until vehicle reaches the stop,
    // based on the arrival time if available, or the departure time otherwise.
    const time_left_secs = dayjs(
        prediction.arrival_time ?? prediction.departure_time,
    ).diff(dayjs(), "seconds");
    // Equivalent minutes, rounded to int
    const mins_rounded = Math.round(time_left_secs / 60);

    // FIXME: Predictions linger a bit after their times pass.
    // Current rules result in "BRD" changing into "ARR" again
    // after vehicle leaves.
    if (
        time_left_secs <= 90 &&
        prediction.vehicle!.current_status === "STOPPED_AT" &&
        prediction.stop_sequence === prediction.vehicle!.current_stop_sequence
    ) {
        // If seconds <= 90, and the associated vehicle is stopped at the same stop...
        if (prediction.departure_time) {
            // And if departure time is given, show "BRD"
            return "BRD";
        } else {
            // If departure not given, passengers cannot board;
            // usually occurs for last stop
            return "Drop-off";
        }
    } else if (time_left_secs <= 30) {
        // If less than 30s, show "ARR"
        return "ARR";
    } else if (time_left_secs <= 60) {
        // If less than 60s, show "1 min"
        return "1 min";
    } /*else if (Math.ceil(time_left_secs / 60) > 20) {
        // If more than 20m, show "20+ min"
        return "20+ min";
    } */ else {
        // Otherwise, show the rounded minutes
        return `${mins_rounded} min`;
    }
}

export function scheduleCountdownText(schedule: ScheduleResource): string {
    // Calculate seconds until vehicle reaches the stop,
    // based on the arrival time if available, or the departure time otherwise.
    const referenceTime = dayjs(
        schedule.arrival_time ?? schedule.departure_time,
    );

    const timeLeftSecs = referenceTime.diff(dayjs(), "seconds");

    // Equivalent minutes, rounded to int
    const mins_rounded = Math.round(timeLeftSecs / 60);

    if (timeLeftSecs <= 90) {
        // If seconds <= 90, and the associated vehicle is stopped at the same stop...
        if (schedule.departure_time) {
            // And if departure time is given, show "BRD"
            return "BRD?";
        } else {
            // If departure not given, passengers cannot board;
            // usually occurs for last stop
            return "Drop-off";
        }
    } else if (timeLeftSecs <= 30) {
        // If less than 30s, show "ARR"
        return "ARR?";
    } else if (timeLeftSecs <= 60) {
        // If less than 60s, show "1 min"
        return "1 min?";
    } else if (Math.ceil(timeLeftSecs / 60) > 20) {
        // If more than 20m, show absolute time instead (different from prediction times)
        return referenceTime.format("hh:mm A");
    } else {
        // Otherwise, show the rounded minutes
        return `${mins_rounded} min?`;
    }
}
