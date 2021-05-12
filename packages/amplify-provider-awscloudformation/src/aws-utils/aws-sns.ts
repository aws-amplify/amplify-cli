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
      // till the SDK is not released cast the type to any and catch it and do nothing
      const snsClient = (this.sns as unknown) as any;
      const result = await snsClient.getSMSSandboxAccountStatus().promise();
      return result.IsInSandbox;
    } catch (e) {
      if (e instanceof TypeError) {
        // AWS SDK is not updated yet.
      } else if (e.code === 'ResourceNotFound') {
        // API is not public yet
      } else if (e.code === 'AuthorizationError') {
        // Creds dont have permission to query sandbox status
      } else if (e.code === 'UnknownEndpoint') {
        // Network error
      } else {
        throw e;
      }
    }
  }
}
