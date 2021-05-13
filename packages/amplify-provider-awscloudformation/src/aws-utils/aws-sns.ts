import { $TSAny, $TSContext } from 'amplify-cli-core';
import { loadConfiguration } from '../configuration-manager';
import aws from './aws.js';

export class SNS {
  private static instance: SNS;
  private readonly sns: AWS.SNS;

  static async getInstance(context: $TSContext, options = {}): Promise<SNS> {
    if (!SNS.instance) {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      SNS.instance = new SNS(context, cred, options);
    }
    return SNS.instance;
  }

  private constructor(context: $TSContext, cred: $TSAny, options = {}) {
    this.sns = new aws.SNS({ ...test, ...cred, ...options });
  }

  public async isInSandboxMode(): Promise<boolean> {
    // AWS SDK still does not have getSMSSandboxAccountStatus. Casting sns to any to avoid compile error
    // Todo: remove any casting once aws-sdk is updated
    const snsClient = (this.sns as unknown) as any;
    const result = await snsClient.getSMSSandboxAccountStatus().promise();
    return result.IsInSandbox;
  }
}
