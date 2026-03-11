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

/**
 * Single instantiation point for all AWS SDK clients used during Gen1 app introspection.
 */
export interface AwsClients {
  readonly amplify: AmplifyClient;
  readonly appSync: AppSyncClient;
  readonly cloudFormation: CloudFormationClient;
  readonly cognitoIdentityProvider: CognitoIdentityProviderClient;
  readonly cognitoIdentity: CognitoIdentityClient;
  readonly s3: S3Client;
  readonly lambda: LambdaClient;
  readonly cloudWatchEvents: CloudWatchEventsClient;
  readonly dynamoDB: DynamoDBClient;
  readonly apiGateway: APIGatewayClient;
}

/**
 * Creates all AWS SDK clients needed for Gen1 app introspection.
 */
export function createAwsClients(region: string): AwsClients {
  return {
    amplify: new AmplifyClient(),
    appSync: new AppSyncClient(),
    cloudFormation: new CloudFormationClient(),
    cognitoIdentityProvider: new CognitoIdentityProviderClient(),
    cognitoIdentity: new CognitoIdentityClient(),
    s3: new S3Client(),
    lambda: new LambdaClient({ region }),
    cloudWatchEvents: new CloudWatchEventsClient(),
    dynamoDB: new DynamoDBClient(),
    apiGateway: new APIGatewayClient(),
  };
}
