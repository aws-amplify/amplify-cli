import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { CognitoIdentityProviderClient, CognitoIdentityProviderClientConfig } from '@aws-sdk/client-cognito-identity-provider';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { AwsV3Secrets, loadConfiguration } from '../configuration-manager';
import { proxyAgent } from './aws-globals';

export class CognitoUserPoolClientProvider {
  private static instance: CognitoUserPoolClientProvider;
  readonly client: CognitoIdentityProviderClient;

  static async getInstance(context: $TSContext, options = {}): Promise<CognitoUserPoolClientProvider> {
    if (!CognitoUserPoolClientProvider.instance) {
      let cred: AwsV3Secrets = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      CognitoUserPoolClientProvider.instance = new CognitoUserPoolClientProvider(cred, options);
    }
    return CognitoUserPoolClientProvider.instance;
  }

  constructor(creds: AwsV3Secrets, options = {}) {
    const clientConfig: CognitoIdentityProviderClientConfig = {
      ...creds,
      ...options,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
        expiration: creds.expiration,
      },
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    };

    this.client = new CognitoIdentityProviderClient(clientConfig);
  }
}
