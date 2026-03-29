import { AmplifyClient } from '@aws-sdk/client-amplify';
import { AppSyncClient } from '@aws-sdk/client-appsync';
import { CloudFormationClient } from '@aws-sdk/client-cloudformation';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { CognitoIdentityClient } from '@aws-sdk/client-cognito-identity';
import { S3Client } from '@aws-sdk/client-s3';
import { LambdaClient } from '@aws-sdk/client-lambda';
import { CloudWatchEventsClient } from '@aws-sdk/client-cloudwatch-events';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { APIGatewayClient } from '@aws-sdk/client-api-gateway';
import { SSMClient } from '@aws-sdk/client-ssm';
import { STSClient } from '@aws-sdk/client-sts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import type { AwsSdkConfig } from '@aws-amplify/amplify-provider-awscloudformation';
import { NodeHttpHandler } from '@smithy/node-http-handler';

/**
 * Single instantiation point for all AWS SDK clients used during Gen2 migration.
 * Shared by both the generate and refactor steps.
 */
export class AwsClients {
  public readonly amplify: AmplifyClient;
  public readonly appSync: AppSyncClient;
  public readonly cloudFormation: CloudFormationClient;
  public readonly cognitoIdentityProvider: CognitoIdentityProviderClient;
  public readonly cognitoIdentity: CognitoIdentityClient;
  public readonly s3: S3Client;
  public readonly lambda: LambdaClient;
  public readonly cloudWatchEvents: CloudWatchEventsClient;
  public readonly dynamoDB: DynamoDBClient;
  public readonly apiGateway: APIGatewayClient;
  public readonly ssm: SSMClient;
  public readonly sts: STSClient;

  private constructor(config: Partial<AwsSdkConfig>) {
    this.amplify = new AmplifyClient(config);
    this.appSync = new AppSyncClient(config);
    this.cloudFormation = new CloudFormationClient(config);
    this.cognitoIdentityProvider = new CognitoIdentityProviderClient(config);
    this.cognitoIdentity = new CognitoIdentityClient(config);
    this.s3 = new S3Client(config);
    this.lambda = new LambdaClient(config);
    this.cloudWatchEvents = new CloudWatchEventsClient(config);
    this.dynamoDB = new DynamoDBClient(config);
    this.apiGateway = new APIGatewayClient(config);
    this.ssm = new SSMClient(config);
    this.sts = new STSClient(config);
  }

  public static async create(context: $TSContext): Promise<AwsClients> {
    context.amplify.constructExeInfo(context);

    const providerPlugins = context.amplify.getProviderPlugins(context);
    const provider = require(providerPlugins['awscloudformation']);

    let cred = {};
    try {
      cred = await provider.loadConfiguration(context);
    } catch (error) {
      // ignore missing config
    }

    const config = {
      ...cred,
      requestHandler: new NodeHttpHandler({
        httpAgent: provider.proxyAgent(),
        httpsAgent: provider.proxyAgent(),
      }),
    };

    return new AwsClients(config);
  }
}
