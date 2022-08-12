import AWS from 'aws-sdk';
import { $TSContext } from 'amplify-cli-core';
import aws from './aws';
import { loadConfiguration } from '../configuration-manager';

/**
 * Amplify Backend Class
 */
export class AmplifyBackend {
  private static instance: AmplifyBackend;
  private readonly context: $TSContext;
  public amplifyBackend: AWS.AmplifyBackend;

  /**
   * Configures the instance for the Amplify Backend Client
   */
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
    const { AMPLIFY_BACKEND_ENDPOINT, AMPLIFY_BACKEND_REGION } = process.env;
    this.amplifyBackend = new aws.AmplifyBackend({
      ...creds,
      ...options,
      ...(AMPLIFY_BACKEND_ENDPOINT && { endpoint: AMPLIFY_BACKEND_ENDPOINT }),
      ...(AMPLIFY_BACKEND_REGION && { region: AMPLIFY_BACKEND_REGION }),
    });
  }
}
