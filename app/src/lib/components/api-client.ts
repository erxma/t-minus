import { MbtaApiClient } from "@t-minus/shared";

export const apiClient = new MbtaApiClient(
    import.meta.env.VITE_MBTA_API_BASE_URL,
);
