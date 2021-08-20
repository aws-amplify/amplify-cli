import axios, { AxiosResponse } from 'axios';
import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { AppSyncSimulatorDataSourceHttpConfig } from '../../type-definition';

export class HttpDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  private endpoint: string;

  constructor(config: AppSyncSimulatorDataSourceHttpConfig) {
    this.endpoint = config?.httpConfig?.endpoint;
  }

  public async load(payload: any): Promise<any> {
    try {
      const axiosRes: AxiosResponse = await axios({
        method: payload.method,
        url: this.endpoint + payload.resourcePath,
        headers: payload.params.headers,
        data: { query: payload.params.query },
        params: { query: payload.params.query },
      });
      const result = this.parseResponse(axiosRes);
      const cfxResult = { body: result, statusCode: axiosRes.status, headers: axiosRes.headers };
      return cfxResult;
    } catch (error) {
      console.log('HTTP Data source failed with the following error:');
      if (error.response.status === 400) console.error(error.response.data);
      else console.error(error);
      throw error;
    }
  }

  private parseResponse = (response: AxiosResponse) => {
    let result = response.data?.data;
    if (!result) {
      throw new Error('Missing result in response (response.data.data is undefined.)');
    }
    let first = Object.keys(result)[0];

    if (Array.isArray(result[first])) result = result[first];
    else result = this.flattenObject(result);

    return JSON.stringify(result);
  };

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
