export declare function appsyncGraphQLRequest(resource: {
    [id: string]: any;
}, op: {
    query: string;
    variables: string | null;
}): Promise<unknown>;
export declare const getProjectSchema: (projRoot: string, apiName: string) => string;
