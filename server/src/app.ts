import { createProxyMiddleware } from "http-proxy-middleware";
import express from "express";
import cors from "cors";
import "dotenv/config";
import assert from "node:assert";

const PORT = process.env.PORT ?? 3000;
const MBTA_API_BASE_URL = process.env.MBTA_API_BASE_URL;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;
const SELF_HEARTBEAT_URL = process.env.SELF_HEARTBEAT_URL;
const SELF_HEARTBEAT_INTERVAL_MS = Number(
    process.env.SELF_HEARTBEAT_INTERVAL_MS ?? 0,
);
const MBTA_API_KEY = process.env.MBTA_API_KEY;

assert(MBTA_API_BASE_URL);
assert(ALLOWED_ORIGINS);
assert(MBTA_API_KEY);

const app = express();

const proxyMiddleware = createProxyMiddleware({
    target: MBTA_API_BASE_URL,
    changeOrigin: true,
    pathRewrite: { "^/mbta-api": "" },
    on: {
        proxyReq: (proxyReq, _, res) => {
            res.on("close", () => proxyReq.destroy());
            proxyReq.setHeader("X-API-Key", MBTA_API_KEY);
        },
    },
});
app.use("/mbta-api", proxyMiddleware);

// Basic health check endpoint
app.get("/health-check", (_, res) => {
    res.send("OK");
});

app.use(
    cors({
        origin: ALLOWED_ORIGINS?.split(","),
    }),
);

app.listen(PORT);

console.log(`Proxy server running on port ${PORT}`);
console.log(`Forwarding requests to ${MBTA_API_BASE_URL}`);

// Send regular heartbeats to self to prevent Render spindown...
// Hobby project with no real users anyway
if (SELF_HEARTBEAT_INTERVAL_MS > 0) {
    if (SELF_HEARTBEAT_URL) {
        setInterval(
            () => heartbeat(SELF_HEARTBEAT_URL),
            SELF_HEARTBEAT_INTERVAL_MS,
        );
        console.warn(
            `Self-heartbeat enabled with interval ${SELF_HEARTBEAT_INTERVAL_MS}ms.`,
        );
    } else {
        console.warn(
            "Non-zero SELF_HEARTBEAT_INTERVAL_MS was set, but no SELF_URL provided. Heartbeat won't run.",
        );
    }
} else {
    console.log("Self-heartbeat is disabled.");
}

function heartbeat(url: string) {
    fetch(url).catch((err) => {
        console.error(`Self-heartbeat failed: ${err.message}`);
    });
}
