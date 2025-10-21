import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { APIGatewayClient, APIGatewayClientConfig } from '@aws-sdk/client-api-gateway';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import { loadConfiguration } from '../configuration-manager';
import { proxyAgent } from './aws-globals';

export class APIGateway {
  private static instance: APIGateway;
  private readonly context: $TSContext;
  public readonly apigw: APIGatewayClient;

  static async getInstance(context: $TSContext, options = {}): Promise<APIGateway> {
    if (!APIGateway.instance) {
      let cred = {};
      try {
        cred = await loadConfiguration(context);
      } catch (e) {
        // ignore missing config
      }

      APIGateway.instance = new APIGateway(context, cred, options);
    }
    return APIGateway.instance;
  }

  constructor(context: $TSContext, creds, options = {}) {
    this.context = context;

    const clientConfig: APIGatewayClientConfig = {
      ...creds,
      ...options,
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    };

    this.apigw = new APIGatewayClient(clientConfig);
  }
}
