/// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_MBTA_API_BASE_URL: string;
    readonly VITE_LIVE_UPDATE_METHOD: "stream" | "poll";
    readonly VITE_POLL_INTERVAL_MS: number;
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}
