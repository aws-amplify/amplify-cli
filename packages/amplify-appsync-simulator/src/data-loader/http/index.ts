import axios from 'axios';
import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { AppSyncSimulatorDataSourceHttpConfig } from '../../type-definition';
import { print } from 'graphql';

export class HttpDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  private endpoint: string;
  // private method: 'PUT' | 'POST' | 'GET' | 'DELETE' | 'PATCH';
  // private headers: Array<{key: string, value: string}>;
  // private body: object;

  constructor(config: AppSyncSimulatorDataSourceHttpConfig) {
    this.endpoint = config?.httpConfig?.endpoint;
  }

  public async load(payload: any, extraData?: any): Promise<any> {
    // console.log('extraData');
    // console.log((await import('util')).inspect(extraData, {depth: null}));
    console.log('payload');
    console.log(payload);
    try {
      const result = await axios({
        method: payload.method,
        url: this.endpoint,
        headers: payload.params.headers,
        data: payload.params.query,
        params: { query: print(extraData.info.operation.selectionSet) },
      });
      console.log(result.data);
      return result.data;
    } catch (error) {
      console.log('HTTP Data source failed with the following error:');
      console.error(error);
      throw error;
    }
  }
}
