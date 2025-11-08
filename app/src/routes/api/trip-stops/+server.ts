import { DISABLE_SERVER_CACHE } from "$env/static/private";
import { TTL_CACHE } from "$lib/server/cache";
import { apiClient } from "$lib/util/api-client";
import { error, type RequestHandler } from "@sveltejs/kit";

const CACHE_TTL_SECS = 3600; // 1 hour

export const GET: RequestHandler = async ({ url }) => {
    const tripId = url.searchParams.get("trip");
    if (!tripId) {
        error(400, "missing trip parameter");
    }

    // Check cache
    const cacheKey = `trip-stops/${tripId}`;
    if (!DISABLE_SERVER_CACHE) {
        const cached = TTL_CACHE.get(cacheKey);
        if (cached) {
            return new Response(JSON.stringify(cached), {
                headers: {
                    "Content-Type": "application/json",
                    "cache-control": `public, max-age=${TTL_CACHE.getRemainingTTL(cacheKey) / 1000}`,
                },
            });
        }
    }

    const response = await apiClient.fetch("trips", {
        filters: {
            id: tripId,
        },
        fields: {
            trip: [],
        },
        include: ["stops"],
    });

    const stops = response[0].stops!;

    if (!DISABLE_SERVER_CACHE) {
        TTL_CACHE.set(cacheKey, stops, {
            ttl: CACHE_TTL_SECS * 1000,
        });
    }

    return new Response(JSON.stringify(stops), {
        headers: {
            "Content-Type": "application/json",
            "cache-control": `public, max-age=${CACHE_TTL_SECS}`,
        },
    });
};
