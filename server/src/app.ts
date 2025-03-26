import { createProxyMiddleware } from "http-proxy-middleware";
import express from "express";
import cors from "cors";
import "dotenv/config";

const PORT = process.env.PORT ?? 3000;
const MBTA_API_BASE_URL = process.env.MBTA_API_BASE_URL;
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS;

if (!MBTA_API_BASE_URL) {
    throw new Error("MBTA API URL not defined.");
}

if (!ALLOWED_ORIGINS) {
    throw new Error("Allowed origins have not been defined.");
}

const app = express();

const proxyMiddleware = createProxyMiddleware({
    target: MBTA_API_BASE_URL,
    changeOrigin: true,
    pathRewrite: { "^/mbta-api": "" },
});
app.use("/mbta-api", proxyMiddleware);

app.use(
    cors({
        origin: ALLOWED_ORIGINS?.split(","),
    }),
);

app.listen(PORT);

console.log(`Proxy server running on port ${PORT}`);
console.log(`Forwarding requests to ${MBTA_API_BASE_URL}`);
