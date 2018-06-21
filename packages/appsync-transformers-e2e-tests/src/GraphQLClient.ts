import axios from 'axios'

export interface GraphQLLocation {
    line: number;
    column: number;
}
export interface GraphQLError {
    message: string;
    locations: GraphQLLocation[];
    path: string[]
}
export interface GraphQLResponse {
    data: any;
    errors: GraphQLError[]
}
export class GraphQLClient {
    constructor(private url: string, private headers: any) { }

    async query(query: string, variables: any): Promise<GraphQLResponse> {
        const axRes = await axios.post<GraphQLResponse>(
            this.url, {
                query,
                variables
            }, { headers: this.headers }
        )
        return axRes.data
    }
}