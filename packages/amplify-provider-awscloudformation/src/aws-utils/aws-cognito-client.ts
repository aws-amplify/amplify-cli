import { $TSContext } from '@aws-amplify/amplify-cli-core';
import aws from './aws.js';
import * as AWS from 'aws-sdk';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';

export class CognitoUserPoolClientProvider {
  private static instance: CognitoUserPoolClientProvider;
  readonly client: AWS.CognitoIdentityServiceProvider;

  static async getInstance(context: $TSContext, options = {}): Promise<CognitoUserPoolClientProvider> {
    if (!CognitoUserPoolClientProvider.instance) {
      let cred: AwsSecrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      CognitoUserPoolClientProvider.instance = new CognitoUserPoolClientProvider(cred, options);
    }
    return CognitoUserPoolClientProvider.instance;
  }

  constructor(creds: AwsSecrets, options = {}) {
    this.client = new aws.CognitoIdentityServiceProvider({ ...creds, ...options });
  }
}
