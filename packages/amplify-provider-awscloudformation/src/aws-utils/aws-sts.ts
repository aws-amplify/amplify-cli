import { STSClient, GetCallerIdentityCommand, GetCallerIdentityCommandOutput } from '@aws-sdk/client-sts';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { loadConfiguration } from '../configuration-manager';
import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { proxyAgent } from './aws-globals';

export class STS {
  private static instance: STS;
  private readonly context: $TSContext;
  private readonly sts: STSClient;

  static async getInstance(context: $TSContext, options = {}): Promise<STS> {
    if (!STS.instance) {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      STS.instance = new STS(context, cred, options);
    }
    return STS.instance;
  }

  private constructor(context: $TSContext, cred: $TSAny, options = {}) {
    this.context = context;
    this.sts = new STSClient({
      ...cred,
      ...options,
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    });
  }

  async getCallerIdentity(): Promise<GetCallerIdentityCommandOutput> {
    return await this.sts.send(new GetCallerIdentityCommand({}));
  }
}
