import type { OccupancyStatus } from "@t-minus/shared";

export type VisualKind = "scale" | "closed" | "unknown";

export interface OccupancyStatusMeta {
    kind: VisualKind;
    segments?: number;
    shade?: number;
    label: string;
}

export const OCCUPANCY_STATUS_META: Record<
    OccupancyStatus,
    OccupancyStatusMeta
> = {
    MANY_SEATS_AVAILABLE: {
        kind: "scale",
        segments: 1,
        shade: 1.3,
        label: "Many seats available",
    },
    FEW_SEATS_AVAILABLE: {
        kind: "scale",
        segments: 2,
        shade: 1,
        label: "Few seats available",
    },
    STANDING_ROOM_ONLY: {
        kind: "scale",
        segments: 3,
        shade: 0.8,
        label: "Standing room only",
    },
    CRUSHED_STANDING_ROOM_ONLY: {
        kind: "scale",
        segments: 4,
        shade: 0.6,
        label: "Crushed standing room",
    },
    FULL: {
        kind: "scale",
        segments: 4,
        shade: 0.5,
        label: "Full",
    },
    NOT_ACCEPTING_PASSENGERS: {
        kind: "closed",
        label: "Not accepting passengers",
    },
    NO_DATA_AVAILABLE: {
        kind: "unknown",
        label: "No data available",
    },
};
