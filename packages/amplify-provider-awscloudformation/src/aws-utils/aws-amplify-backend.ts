import AWS from 'aws-sdk';
import aws from './aws';
import { loadConfiguration } from '../configuration-manager';
import { $TSContext } from 'amplify-cli-core';

export class AmplifyBackend {
  private static instance: AmplifyBackend;
  private readonly context: $TSContext;
  public amplifyBackend: AWS.AmplifyBackend;

  static async getInstance(context: $TSContext, options = {}): Promise<AmplifyBackend> {
    if (!AmplifyBackend.instance) {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }
      AmplifyBackend.instance = new AmplifyBackend(context, cred, options);
    }
    return AmplifyBackend.instance;
  }

  private constructor(context: $TSContext, creds, options = {}) {
    this.context = context;
    this.amplifyBackend = new aws.AmplifyBackend({ ...creds, ...options });
  }
}
