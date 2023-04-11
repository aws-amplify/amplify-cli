import { $TSContext } from 'amplify-cli-core';
import aws from './aws.js';
import * as AWS from 'aws-sdk';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';

export class CognitoUserPoolClientProvider {
  private static instance: CognitoUserPoolClientProvider;
  readonly client: AWS.CognitoIdentityServiceProvider;

  static async getInstance(context: $TSContext, options = {}): Promise<CognitoUserPoolClientProvider> {
    if (!CognitoUserPoolClientProvider.instance) {
      const cred: AwsSecrets = await loadConfiguration(context);

      CognitoUserPoolClientProvider.instance = new CognitoUserPoolClientProvider(cred, options);
    }
    return CognitoUserPoolClientProvider.instance;
  }

  constructor(creds: AwsSecrets, options = {}) {
    this.client = new aws.CognitoIdentityServiceProvider({ ...creds, ...options });
  }
}
