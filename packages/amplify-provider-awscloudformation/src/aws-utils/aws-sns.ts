import { $TSAny, $TSContext } from 'amplify-cli-core';
import { loadConfiguration } from '../configuration-manager';
import aws from './aws.js';

export class SNS {
  private static instance: SNS;
  private readonly sns: AWS.SNS;
  private readonly context: $TSContext;

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
    this.context = context;
    this.sns = new aws.SNS({ ...cred, ...options });
  }

  public async isInSandboxMode(): Promise<boolean> {
    try {
      const result = await this.sns.getSMSSandboxAccountStatus().promise();
      return result.IsInSandbox;
    } catch (exception) {
      // There mainly be 2 types of errors
      // 1. Network
      // 2. Credentials not having the policy to query the SMS Sandbox status
      // Todo: need to verify what is the possible error code when the permission is lacking
      // and throw the exception accordingly to either show an error stating the permission is missing
      // or network error and could not get the SMS sandbox status
    }
  }
}
