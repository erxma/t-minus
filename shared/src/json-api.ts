/**
 * @file Simple partial implementation of JSON:API deserialization,
 * just enough to work with the MBTA API.
 */

export interface JsonApiDocument {
    data: JsonApiResource | JsonApiResource[] | null;
    included?: JsonApiResource[];
}

export interface JsonApiResource {
    id: string;
    type: string;
    attributes?: { [key: string]: unknown };
    relationships?: Relationships;
}

interface ResourceIdentifier {
    id: string;
    type: string;
}

type Relationships = { [key: string]: RelationshipObject };

interface RelationshipObject {
    data: ResourceIdentifier | ResourceIdentifier[] | null;
}

export interface CollectionRequestParams {
    page?: {
        offset?: number;
        limit?: number;
    };
    sort?: string;
    filters?: {
        [key: string]: unknown | unknown[];
    };
    fields?: RequestFields;
    include?: string[];
}

interface RequestFields {
    [key: string]: string[];
}

export function buildUrlParams(params: CollectionRequestParams): {
    [key: string]: string;
} {
    const map = new Map<string, string>();

    for (const [key, value] of Object.entries(params.page ?? {})) {
        map.set(`page[${key}]`, String(value));
    }

    for (const [key, value] of Object.entries(params.filters ?? {})) {
        const list = Array.isArray(value)
            ? value.join(",")
            : String(value ?? "");
        map.set(`filter[${key}]`, list);
    }

    for (const [key, value] of Object.entries(params.fields ?? {})) {
        map.set(`fields[${key}]`, value.join(","));
    }

    if (params.include) {
        map.set("include", params.include.join(","));
    }
    if (params.sort) {
        map.set("sort", params.sort);
    }

    return Object.fromEntries(map.entries());
}

/**
 * Flatten/denormalize the structure of a JSON:API document to be easier to work with.
 * Moves attributes directly into the resource(s), and replaces relationships with `included`
 * resources if available, also moved directly into the resource(s).
 * @param document the original document object following the JSON:API spec.
 * @returns Depending on the document's original contents: a flattened object,
 * array of flattened objects, or `null`.
 */
export function flatten(document: JsonApiDocument): object | object[] | null {
    if (document.data === null) {
        return null;
    } else if (Array.isArray(document.data)) {
        return document.data.map((res) =>
            flattenResource(res, document.included ?? [], true),
        );
    } else {
        return flattenResource(document.data, document.included ?? [], true);
    }
}

// Helper to flatten only a single resource.
export function flattenResource(
    resource: JsonApiResource,
    included: JsonApiResource[],
    shouldDenormalizeRelationships: boolean,
): object {
    const relationships = shouldDenormalizeRelationships
        ? denormalizeRelationships(resource.relationships ?? {}, included)
        : resource.relationships;

    const attributes = resource.attributes;
    // Replace any "type" attribute with "_type"
    // JSON:API prohibits such an attribute but it occurs in MBTA API
    if (attributes?.type) {
        attributes.type_ = attributes.type;
        delete attributes.type;
    }

    return {
        id: resource.id,
        type: resource.type,
        ...resource.attributes,
        ...relationships,
    };
}

function denormalizeRelationships(
    relationships: Relationships,
    included: JsonApiResource[],
): object {
    const resultEntries: [string, unknown][] = [];
    for (const [key, relObj] of Object.entries(relationships)) {
        const denormalized = Array.isArray(relObj.data)
            ? relObj.data.map((res) => denormalizeIncluded(res, included))
            : denormalizeIncluded(relObj.data, included);
        resultEntries.push([key, denormalized]);
    }
    return Object.fromEntries(resultEntries);

    function denormalizeIncluded(
        resId: ResourceIdentifier | null,
        included: JsonApiResource[],
    ): object | ResourceIdentifier | null {
        if (resId === null) {
            return null;
        }

        const resource = included.find(
            (incl) => incl.type === resId.type && incl.id === resId.id,
        );
        // Do not recursively flatten the relationships of included resources
        return resource ? flattenResource(resource, included, false) : resId;
    }
}
