import { $TSContext } from '@aws-amplify/amplify-cli-core';
import * as AWS from 'aws-sdk';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import aws from './aws.js';
import { proxyAgent } from './aws-globals';

export class LocationService {
  private static instance: LocationService;
  readonly client: AWS.Location;

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
    this.client = new aws.Location({
      ...cred,
      ...options,
      httpOptions: {
        agent: proxyAgent(),
      },
    });
  }
}
