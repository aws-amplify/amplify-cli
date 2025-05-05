import aws from './aws.js';
import { loadConfiguration } from '../configuration-manager';
import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { proxyAgent } from './aws-globals';

export class STS {
  private static instance: STS;
  private readonly context: $TSContext;
  private readonly sts: AWS.STS;

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
    this.sts = new aws.STS({
      ...cred,
      options,
      httpOptions: {
        agent: proxyAgent(),
      },
    });
  }

  async getCallerIdentity(): Promise<AWS.STS.GetCallerIdentityResponse> {
    return await this.sts.getCallerIdentity().promise();
  }
}
