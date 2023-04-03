export interface GraphQLLocation {
    line: number;
    column: number;
}
export interface GraphQLError {
    message: string;
    locations: GraphQLLocation[];
    path: string[];
}
export interface GraphQLResponse {
    data: any;
    errors: GraphQLError[];
}
export declare class GraphQLClient {
    private url;
    private headers;
    constructor(url: string, headers: any);
    query(query: string, variables: any): Promise<GraphQLResponse>;
}
//# sourceMappingURL=graphql-client.d.ts.map