import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { LocationClient } from '@aws-sdk/client-location';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import { proxyAgent } from './aws-globals';

export class LocationService {
  private static instance: LocationService;
  readonly client: LocationClient;

  static async getInstance(context: $TSContext, options = {}): Promise<LocationService> {
    if (!LocationService.instance) {
      let cred: AwsSecrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      LocationService.instance = new LocationService(cred, options);
    }
    return LocationService.instance;
  }

  private constructor(cred: AwsSecrets, options = {}) {
    this.client = new LocationClient({
      ...cred,
      ...options,
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    });
  }
}
