import { mockClient } from 'aws-sdk-client-mock';
import { MigrationApp } from '../app';
import * as cloudcontrol from '@aws-sdk/client-cloudcontrol';

/**
 * Mock for the AWS CloudControl service client (`@aws-sdk/client-cloudcontrol`).
 *
 * CloudControl's GetResource API returns the live properties of a resource
 * given its type and identifier (physical ID). The migration codegen uses this
 * to resolve Fn::GetAtt references (e.g., getting the Arn of a resource).
 *
 * This mock builds a response by looking up the resource's physical ID and
 * constructing an appropriate Arn property based on the resource type and
 * the app's region/account information.
 */
export class CloudControlMock {
  public readonly mock;

  constructor(private readonly app: MigrationApp) {
    this.mock = mockClient(cloudcontrol.CloudControlClient);
    this.mockGetResource();
  }

  private mockGetResource() {
    this.mock
      .on(cloudcontrol.GetResourceCommand)
      .callsFake(async (input: cloudcontrol.GetResourceCommandInput): Promise<cloudcontrol.GetResourceCommandOutput> => {
        const typeName = input.TypeName ?? '';
        const identifier = input.Identifier ?? '';

        const props = this.buildProperties(typeName, identifier);

        return {
          ResourceDescription: { Properties: JSON.stringify(props) },
          $metadata: {},
        };
      });
  }

  /**
   * Constructs a properties object for a given resource type and physical ID.
   * Mimics what CloudControl would return for the Arn attribute.
   */
  private buildProperties(typeName: string, physicalId: string): Record<string, unknown> {
    // If the physical ID is already an ARN, use it directly
    if (physicalId.startsWith('arn:')) {
      return { Arn: physicalId };
    }

    const region = this.app.region;
    // Use a placeholder account ID since we don't have a real one in tests
    const accountId = '123456789012';

    switch (typeName) {
      case 'AWS::S3::Bucket':
        return { Arn: `arn:aws:s3:::${physicalId}` };
      case 'AWS::DynamoDB::Table':
        return {
          Arn: `arn:aws:dynamodb:${region}:${accountId}:table/${physicalId}`,
          StreamArn: `arn:aws:dynamodb:${region}:${accountId}:table/${physicalId}/stream/2024-01-01T00:00:00.000`,
        };
      case 'AWS::Lambda::Function':
        return { Arn: `arn:aws:lambda:${region}:${accountId}:function:${physicalId}` };
      case 'AWS::IAM::Role':
        return { Arn: `arn:aws:iam::${accountId}:role/${physicalId}` };
      case 'AWS::Cognito::UserPool':
        return { Arn: `arn:aws:cognito-idp:${region}:${accountId}:userpool/${physicalId}` };
      case 'AWS::Cognito::UserPoolClient':
        return { ClientId: physicalId };
      case 'AWS::Cognito::IdentityPool':
        return { Id: physicalId };
      case 'AWS::SQS::Queue': {
        // SQS physical IDs are URLs like https://sqs.region.amazonaws.com/account/name
        const queueName = physicalId.split('/').pop() ?? physicalId;
        return { Arn: `arn:aws:sqs:${region}:${accountId}:${queueName}` };
      }
      case 'AWS::SNS::Topic':
        return { TopicArn: `arn:aws:sns:${region}:${accountId}:${physicalId}`, Arn: `arn:aws:sns:${region}:${accountId}:${physicalId}` };
      case 'AWS::Kinesis::Stream':
        return { Arn: `arn:aws:kinesis:${region}:${accountId}:stream/${physicalId}` };
      case 'AWS::AppSync::GraphqlApi':
        return { ApiId: physicalId, Arn: `arn:aws:appsync:${region}:${accountId}:apis/${physicalId}` };
      case 'AWS::Events::Rule':
        return { Arn: `arn:aws:events:${region}:${accountId}:rule/${physicalId}` };
      default:
        // For unknown types, return the physical ID as Arn if it looks like one,
        // otherwise return empty props (GetAtt will remain unresolved)
        return {};
    }
  }
}
