import axios from 'axios';
import { $TSAny } from 'amplify-cli-core';

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
  data: $TSAny;
  errors: GraphQLError[];
}
export class GraphQLClient {
  constructor(private url: string, private headers: $TSAny) {}

  async query(query: string, variables: $TSAny): Promise<GraphQLResponse> {
    const axRes = await axios.post<GraphQLResponse>(
      this.url,
      {
        query,
        variables,
      },
      { headers: this.headers },
    );
    return axRes.data;
  }
}
