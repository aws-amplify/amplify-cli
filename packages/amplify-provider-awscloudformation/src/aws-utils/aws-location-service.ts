import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { LocationClient } from '@aws-sdk/client-location';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { AwsV3Secrets, loadConfiguration } from '../configuration-manager';
import { proxyAgent } from './aws-globals';

export class LocationService {
  private static instance: LocationService;
  readonly client: LocationClient;

  static async getInstance(context: $TSContext, options = {}): Promise<LocationService> {
    if (!LocationService.instance) {
      let cred: AwsV3Secrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      LocationService.instance = new LocationService(cred, options);
    }
    return LocationService.instance;
  }

  private constructor(cred: AwsV3Secrets, options = {}) {
    // this is a temporary workaround until PR#14236 is merged
    let region;
    if (JSON.stringify(options) === '{}') {
      region = (options as { region: string }).region ? (options as { region: string }).region : cred.region;
    }

    this.client = new LocationClient({
      ...options,
      credentials: {
        accessKeyId: cred.accessKeyId,
        secretAccessKey: cred.secretAccessKey,
        sessionToken: cred.sessionToken,
        expiration: cred.expiration,
      },
      region: region,
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    });
  }
}
