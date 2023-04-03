import { $TSContext } from 'amplify-cli-core';
import aws from './aws.js';
import * as AWS from 'aws-sdk';
import { AwsSecrets, loadConfiguration } from '../configuration-manager';

export class CognitoUserPoolClient {
  private static instance: CognitoUserPoolClient;
  readonly client: AWS.CognitoIdentityServiceProvider;

  static async getInstance(context: $TSContext, options = {}): Promise<CognitoUserPoolClient> {
    if (!CognitoUserPoolClient.instance) {
      let cred: AwsSecrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      CognitoUserPoolClient.instance = new CognitoUserPoolClient(cred, options);
    }
    return CognitoUserPoolClient.instance;
  }

  constructor(creds: AwsSecrets, options = {}) {
    this.client = new aws.CognitoIdentityServiceProvider({ ...creds, ...options });
  }
}
