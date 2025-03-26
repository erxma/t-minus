import { predictionCountdownText } from "./formatting";
import { describe, expect, test, vitest } from "vitest";
import type { PredictionResource } from "@t-minus/shared";

describe("Countdown text", () => {
    test("Display 'BRD' when conditions are met and previous conditions fail", () => {
        vitest.setSystemTime("2020-01-01T12:00:00Z");
        const prediction1: PredictionResource = {
            type: "prediction",
            id: "id1",
            arrival_time: "2020-01-01T12:01:00Z",
            departure_time: "2020-01-01T12:02:00Z",
            stop_sequence: 10,
            vehicle: {
                type: "vehicle",
                id: "id2",
                current_status: "STOPPED_AT",
                current_stop_sequence: 10,
            },
        };

        expect(predictionCountdownText(prediction1)).toEqual("BRD");
    });

    test("Display 'ARR' when conditions are met and previous conditions fail", () => {
        vitest.setSystemTime("2020-01-01T12:00:30Z");
        const prediction1: PredictionResource = {
            type: "prediction",
            id: "id1",
            arrival_time: "2020-01-01T12:01:00Z",
            departure_time: "2020-01-01T12:02:00Z",
            stop_sequence: 10,
            vehicle: {
                type: "vehicle",
                id: "id2",
                current_status: "INCOMING_AT",
                current_stop_sequence: 10,
            },
        };

        expect(predictionCountdownText(prediction1)).toEqual("ARR");
    });
});
