import { IAMClient as IAM, IAMClientConfig } from '@aws-sdk/client-iam';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { AwsSdkConfig } from '../utils/auth-types.js';
import { getAwsConfig } from '../configuration-manager';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { proxyAgent } from './aws-globals';

export class IAMClient {
  private static instance: IAMClient;
  public readonly client: IAM;

  static async getInstance(context: $TSContext, options: IAMClientConfig = {}): Promise<IAMClient> {
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

  private constructor(creds: AwsSdkConfig, options: IAMClientConfig = {}) {
    this.client = new IAM({
      ...creds,
      ...options,
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    });
  }
}
