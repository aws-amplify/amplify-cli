import { AmplifyClient } from '@aws-sdk/client-amplify';
import { AppSyncClient } from '@aws-sdk/client-appsync';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { S3Client, S3ClientConfig } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import { SSMClient } from '@aws-sdk/client-ssm';
import { STSClient } from '@aws-sdk/client-sts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { NodeHttpHandler } from '@smithy/node-http-handler';
import type { AmplifyClientConfig } from '@aws-sdk/client-amplify';
import { ProxyAgent } from 'proxy-agent';
import { CloudControlClient } from '@aws-sdk/client-cloudcontrol';
import { ConfiguredRetryStrategy } from '@smithy/util-retry';

export const proxyAgent = () => {
  let httpAgent;
  const httpProxy = process.env.HTTP_PROXY || process.env.HTTPS_PROXY;
  if (httpProxy) {
    httpAgent = new ProxyAgent();
  }
  return httpAgent;
};

// all clients share the same config so we just use one of them
// to encapsulate all properties we need.
type ClientConfig = AmplifyClientConfig;

/**
 * Single instantiation point for all AWS SDK clients used during Gen2 migration.
 */
export class AwsClients {
  public readonly amplify: AmplifyClient;
  public readonly appSync: AppSyncClient;
  public readonly cloudFormation: CloudFormationClient;
  public readonly cloudControl: CloudControlClient;
  public readonly cognitoIdentityProvider: CognitoIdentityProviderClient;
  public readonly cognitoIdentity: CognitoIdentityClient;
  public readonly s3: S3Client;
  public readonly lambda: LambdaClient;
  public readonly cloudWatchEvents: CloudWatchEventsClient;
  public readonly dynamoDB: DynamoDBClient;
  public readonly apiGateway: APIGatewayClient;
  public readonly ssm: SSMClient;
  public readonly sts: STSClient;

  private constructor(config: ClientConfig) {
    this.amplify = new AmplifyClient(config);
    this.appSync = new AppSyncClient(config);
    this.cloudFormation = new CloudFormationClient(config);
    this.cloudControl = new CloudControlClient(config);
    this.cognitoIdentityProvider = new CognitoIdentityProviderClient(config);
    this.cognitoIdentity = new CognitoIdentityClient(config);
    this.s3 = new S3Client(config as S3ClientConfig);
    this.lambda = new LambdaClient(config);
    this.cloudWatchEvents = new CloudWatchEventsClient(config);
    this.dynamoDB = new DynamoDBClient(config);
    this.apiGateway = new APIGatewayClient(config);
    this.ssm = new SSMClient(config);
    this.sts = new STSClient(config);
  }

  public static async create(context: $TSContext): Promise<AwsClients> {
    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = require(providerPlugins['awscloudformation']);

    let cred = {};
    try {
      context.amplify.constructExeInfo(context);
      cred = await provider.loadConfiguration(context);
    } catch (error) {
      // ignore missing config, the user may have default credentials configured,
      // which is enough for us. it will fail later on if not.
    }

    const config: ClientConfig = {
      ...cred,
      customUserAgent: provider.formUserAgentParam(context, 'gen2-migration'),
      // https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-retries.html
      retryStrategy: new ConfiguredRetryStrategy(10, (attempt) => 1000 * 2 ** attempt),
      requestHandler: new NodeHttpHandler({
        httpAgent: proxyAgent(),
        httpsAgent: proxyAgent(),
      }),
    };

    return new AwsClients(config);
  }
}
