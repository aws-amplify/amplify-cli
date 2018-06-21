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

    async query(query: string, vars: any): Promise<GraphQLResponse> {
        const axRes = await axios.post<GraphQLResponse>(
            this.url, vars, { headers: this.headers }
        )
        return axRes.data
    }
}