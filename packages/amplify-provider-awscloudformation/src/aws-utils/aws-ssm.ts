import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import aws from './aws.js';
import * as AWS from 'aws-sdk';
import { proxyAgent } from './aws-globals';

export class SSM {
  private static instance: SSM;
  readonly client: AWS.SSM;

  static async getInstance(context: $TSContext, options: $TSObject = {}): Promise<SSM> {
    if (!SSM.instance) {
      let cred: AwsSecrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      SSM.instance = new SSM(cred, options);
    }
    return SSM.instance;
  }

  private constructor(cred: AwsSecrets, options = {}) {
    this.client = new aws.SSM({
      ...cred,
      ...options,
      httpOptions: {
        agent: proxyAgent(),
      },
    });
  }
}
