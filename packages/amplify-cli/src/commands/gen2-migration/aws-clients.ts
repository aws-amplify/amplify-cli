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

  constructor(params: { readonly region: string }) {
    this.amplify = new AmplifyClient({ region: params.region });
    this.appSync = new AppSyncClient({ region: params.region });
    this.cloudFormation = new CloudFormationClient({ region: params.region });
    this.cognitoIdentityProvider = new CognitoIdentityProviderClient({ region: params.region });
    this.cognitoIdentity = new CognitoIdentityClient({ region: params.region });
    this.s3 = new S3Client({ region: params.region });
    this.lambda = new LambdaClient({ region: params.region });
    this.cloudWatchEvents = new CloudWatchEventsClient({ region: params.region });
    this.dynamoDB = new DynamoDBClient({ region: params.region });
    this.apiGateway = new APIGatewayClient({ region: params.region });
    this.ssm = new SSMClient({ region: params.region });
  }
}
