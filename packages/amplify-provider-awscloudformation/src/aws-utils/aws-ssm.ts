import { $TSContext, $TSObject } from '@aws-amplify/amplify-cli-core';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';
import { SSMClient } from '@aws-sdk/client-ssm';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { proxyAgent } from './aws-globals';

export class SSM {
  private static instance: SSM;
  readonly client: SSMClient;

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
    this.client = new SSMClient({
      ...cred,
      ...options,
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    });
  }
}
