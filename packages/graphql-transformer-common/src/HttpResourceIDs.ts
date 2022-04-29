import { graphqlName } from './util';

export class HttpResourceIDs {
  static HttpDataSourceID(baseURL: string): string {
    // strip the special characters out of baseURL to make the data source ID
    return `${graphqlName(baseURL)}DataSource`;
  }
}
