import axios, { AxiosResponse } from 'axios';
import { AmplifyAppSyncSimulatorDataLoader } from '..';
import { AppSyncSimulatorDataSourceHttpConfig } from '../../type-definition';

export class HttpDataLoader implements AmplifyAppSyncSimulatorDataLoader {
  private endpoint: string;
  private env: string;
  private region: string;

  constructor(config: AppSyncSimulatorDataSourceHttpConfig) {
    this.endpoint = config?.httpConfig?.endpoint;
    this.env = config?.httpConfig?.env === '${env}' ? 'NONE' : config?.httpConfig?.env;
    this.region = config?.httpConfig?.region;
  }

  public async load(payload: any): Promise<any> {
    const reqEndpoint = this.parseUrl(this.endpoint + payload.resourcePath, this.env, this.region);
    try {
      const axiosRes: AxiosResponse = await axios({
        method: payload.method,
        url: reqEndpoint,
        headers: payload.params.headers,
        data: { query: payload.params.query },
        params: { query: payload.params.query },
      });
      const result = this.parseResponse(axiosRes);
      const cfxResult = { body: result, statusCode: axiosRes.status, headers: axiosRes.headers };
      return cfxResult;
    } catch (error) {
      console.log('HTTP Data source failed with the following error:');
      console.error(error);
      if (error.response.status === 400) {
        console.error(error.response?.data);
      }
      throw error;
    }
  }

  private parseResponse = (response: AxiosResponse) => {
    let result = response.data?.data;
    if (!result) {
      throw new Error('Missing result in response (response.data.data is undefined.)');
    }

    // The unit resolver expects a one-level deep object to be returned, so flatten the result to be
    // an object with selected fields (or an array of such objects.)
    let first = Object.keys(result)[0];
    if (Array.isArray(result[first])) {
      result = result[first];
    } else {
      result = this.flattenObject(result);
    }

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

  private parseUrl(resourcePath: string, env: string, region: string): string {
    let newPath = resourcePath.replace(/(\${env})/g, env).replace(/(\${aws_region})/g, region);

    return newPath;
  }
}
