import axios, { AxiosResponse } from 'axios';
import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { AppSyncSimulatorDataSourceHttpConfig } from '../../type-definition';
import { print } from 'graphql';

export class HttpDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  private endpoint: string;

  constructor(config: AppSyncSimulatorDataSourceHttpConfig) {
    this.endpoint = config?.httpConfig?.endpoint;
  }

  public async load(payload: any, extraData?: any): Promise<any> {
    // console.log('extraData');
    // console.log((await import('util')).inspect(extraData, {depth: null}));
    console.log('payload');
    console.log(payload);
    console.log('print');
    console.log(print(extraData.info.operation.selectionSet));

    try {
      const result: AxiosResponse = await axios({
        method: payload.method,
        url: this.endpoint,
        headers: payload.params.headers,
        data: payload.params.query,
        params: { query: print(extraData.info.operation.selectionSet) },
      });

      console.log(result.data);

      const transformedResult = JSON.stringify(this.flattenObject(result.data.data));
      const cfxResult = { body: transformedResult, statusCode: result.status, headers: result.headers };

      console.log(cfxResult);
      return cfxResult;
    } catch (error) {
      console.log('HTTP Data source failed with the following error:');
      console.error(error);
      throw error;
    }
  }

  // Source: https://stackoverflow.com/a/55251598/16010441
  private flattenObject = obj => {
    const flattened = {};

    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(flattened, this.flattenObject(obj[key]));
      } else {
        flattened[key] = obj[key];
      }
    });

    return flattened;
  };
}
