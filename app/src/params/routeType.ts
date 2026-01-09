import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string): param is "subway" | "cr" | "bus" => {
    return param === "subway" || param === "cr" || param === "bus";
}) satisfies ParamMatcher;
