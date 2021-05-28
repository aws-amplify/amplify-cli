import { $TSAny, $TSContext } from 'amplify-cli-core';
import { loadConfiguration } from '../configuration-manager';
import aws from './aws.js';

export class SSM {
  private static instance: SSM;
  readonly client: AWS.SSM;

  static async getInstance(context: $TSContext, options = {}): Promise<SSM> {
    if (!SSM.instance) {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      SSM.instance = new SSM(cred, options);
    }
    return SSM.instance;
  }

  private constructor(cred: $TSAny, options = {}) {
    this.client = new aws.SSM({ ...cred, ...options });
  }
}
