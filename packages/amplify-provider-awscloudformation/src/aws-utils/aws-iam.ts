import aws from './aws.js';
import awstype from 'aws-sdk';
import { IAM } from 'aws-sdk';
import { AwsSdkConfig } from '../utils/auth-types.js';
import { getAwsConfig } from '../configuration-manager';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { proxyAgent } from './aws-globals.js';

export class IAMClient {
  private static instance: IAMClient;
  public readonly client: IAM;

  static async getInstance(context: $TSContext, options: IAM.ClientConfiguration = {}): Promise<IAMClient> {
    if (!IAMClient.instance) {
      let cred: AwsSdkConfig;
      try {
        cred = await getAwsConfig(context);
      } catch (e) {
        // ignore missing config
      }

      IAMClient.instance = new IAMClient(cred, options);
    }
    return IAMClient.instance;
  }

  private constructor(creds: AwsSdkConfig, options: IAM.ClientConfiguration = {}) {
    this.client = new (aws as typeof awstype).IAM({
      ...creds,
      ...options,
      httpOptions: {
        agent: proxyAgent(),
      },
    });
  }
}
