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
import { AwsSdkConfig, loadConfiguration } from '@aws-amplify/amplify-provider-awscloudformation';
import { $TSContext } from '@aws-amplify/amplify-cli-core';

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

  private constructor(creds: AwsSdkConfig) {
    this.amplify = new AmplifyClient(creds);
    this.appSync = new AppSyncClient(creds);
    this.cloudFormation = new CloudFormationClient(creds);
    this.cognitoIdentityProvider = new CognitoIdentityProviderClient(creds);
    this.cognitoIdentity = new CognitoIdentityClient(creds);
    this.s3 = new S3Client(creds);
    this.lambda = new LambdaClient(creds);
    this.cloudWatchEvents = new CloudWatchEventsClient(creds);
    this.dynamoDB = new DynamoDBClient(creds);
    this.apiGateway = new APIGatewayClient(creds);
    this.ssm = new SSMClient(creds);
  }

  public static async create(context: $TSContext): Promise<AwsClients> {
    const configuration = await loadConfiguration(context);
    return new AwsClients(configuration);
  }
}
