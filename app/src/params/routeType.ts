import type { ParamMatcher } from "@sveltejs/kit";

export const match = ((param: string): param is "subway" | "cr" => {
    return param === "subway" || param === "cr";
}) satisfies ParamMatcher;
