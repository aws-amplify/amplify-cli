import { resolveOutputs } from '../../../../commands/gen2-migration/refactor/resolvers/cfn-output-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor/cfn-template';

const baseTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: {
    UserPool: { Type: 'AWS::Cognito::UserPool', Properties: {} },
    S3Bucket: { Type: 'AWS::S3::Bucket', Properties: { Arn: { 'Fn::GetAtt': ['UserPool', 'Arn'] } } },
  },
  Outputs: {
    UserPoolIdOutput: { Value: { Ref: 'UserPool' } },
    UserPoolArnOutput: { Value: { 'Fn::GetAtt': ['UserPool', 'Arn'] } },
  },
};

describe('resolveOutputs', () => {
  it('resolves Ref-based output references in Resources', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        UserPool: { Type: 'AWS::Cognito::UserPool', Properties: {} },
        Consumer: { Type: 'AWS::Lambda::Function', Properties: { PoolId: { Ref: 'UserPool' } } },
      },
      Outputs: {
        UserPoolIdOutput: { Value: { Ref: 'UserPool' } },
      },
    };
    const result = resolveOutputs({
      template,
      stackOutputs: [{ OutputKey: 'UserPoolIdOutput', OutputValue: 'us-east-1_ABC' }],
      stackResources: [],
      region: 'us-east-1',
      accountId: '123456789',
    });
    expect(result.Resources.Consumer.Properties.PoolId).toBe('us-east-1_ABC');
  });

  it('resolves GetAtt Arn references using ARN construction', () => {
    const result = resolveOutputs({
      template: baseTemplate,
      stackOutputs: [
        { OutputKey: 'UserPoolIdOutput', OutputValue: 'us-east-1_ABC' },
        { OutputKey: 'UserPoolArnOutput', OutputValue: 'us-east-1_ABC' },
      ],
      stackResources: [],
      region: 'us-east-1',
      accountId: '123456789',
    });
    expect(result.Resources.S3Bucket.Properties.Arn).toBe('arn:aws:cognito-idp:us-east-1:123456789:userpool/us-east-1_ABC');
  });

  it('falls back to physical resource ID for GetAtt in phase 2', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyRole: { Type: 'AWS::IAM::Role', Properties: {} },
        Consumer: { Type: 'AWS::Lambda::Function', Properties: { RoleArn: { 'Fn::GetAtt': ['MyRole', 'Arn'] } } },
      },
      Outputs: {},
    };
    const result = resolveOutputs({
      template,
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyRole',
          PhysicalResourceId: 'arn:aws:iam::123:role/my-role',
          ResourceType: 'AWS::IAM::Role',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
      region: 'us-east-1',
      accountId: '123456789',
    });
    expect(result.Resources.Consumer.Properties.RoleArn).toBe('arn:aws:iam::123:role/my-role');
  });

  it('replaces Output values with runtime stack output values', () => {
    const result = resolveOutputs({
      template: baseTemplate,
      stackOutputs: [
        { OutputKey: 'UserPoolIdOutput', OutputValue: 'us-east-1_ABC' },
        { OutputKey: 'UserPoolArnOutput', OutputValue: 'arn:aws:cognito-idp:us-east-1:123:userpool/ABC' },
      ],
      stackResources: [],
      region: 'us-east-1',
      accountId: '123456789',
    });
    expect(result.Outputs.UserPoolIdOutput.Value).toBe('us-east-1_ABC');
    expect(result.Outputs.UserPoolArnOutput.Value).toBe('arn:aws:cognito-idp:us-east-1:123:userpool/ABC');
  });

  it('throws when Kinesis stream physical ID is not an ARN', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyStream: { Type: 'AWS::Kinesis::Stream', Properties: {} },
        Consumer: { Type: 'AWS::Lambda::Function', Properties: { StreamArn: { 'Fn::GetAtt': ['MyStream', 'Arn'] } } },
      },
      Outputs: {},
    };
    expect(() =>
      resolveOutputs({
        template,
        stackOutputs: [],
        stackResources: [
          {
            LogicalResourceId: 'MyStream',
            PhysicalResourceId: 'my-stream-name',
            ResourceType: 'AWS::Kinesis::Stream',
            Timestamp: new Date(),
            ResourceStatus: 'CREATE_COMPLETE',
          },
        ],
        region: 'us-east-1',
        accountId: '123456789',
      }),
    ).toThrow('Kinesis stream ARN must be exposed in CloudFormation outputs');
  });
});

/**
 * Phase 2 fallback tests: GetAtt resolved via physical resource IDs from DescribeStackResources.
 * Each test uses empty Outputs: {} so nothing matches in phase 1, forcing phase 2.
 */
describe('resolveOutputs - ARN construction (phase 2 fallback)', () => {
  const ts = new Date();
  const rs = 'CREATE_COMPLETE';

  const makeGetAttTemplate = (logicalId: string, resourceType: string): CFNTemplate => ({
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'test',
    Resources: {
      [logicalId]: { Type: resourceType, Properties: {} },
      Consumer: { Type: 'AWS::Lambda::Function', Properties: { Arn: { 'Fn::GetAtt': [logicalId, 'Arn'] } } },
    },
    Outputs: {},
  });

  it('builds S3 bucket ARN', () => {
    const result = resolveOutputs({
      template: makeGetAttTemplate('MyBucket', 'AWS::S3::Bucket'),
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyBucket',
          PhysicalResourceId: 'my-bucket',
          ResourceType: 'AWS::S3::Bucket',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
      region: 'us-east-1',
      accountId: '123',
    });
    expect(result.Resources.Consumer.Properties.Arn).toBe('arn:aws:s3:::my-bucket');
  });

  it('builds DynamoDB table ARN', () => {
    const result = resolveOutputs({
      template: makeGetAttTemplate('MyTable', 'AWS::DynamoDB::Table'),
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyTable',
          PhysicalResourceId: 'my-table',
          ResourceType: 'AWS::DynamoDB::Table',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
      region: 'us-east-1',
      accountId: '123',
    });
    expect(result.Resources.Consumer.Properties.Arn).toBe('arn:aws:dynamodb:us-east-1:123:table/my-table');
  });

  // SQS physical resource IDs are HTTP URLs. The code extracts the queue name via split('/').pop().
  // Note: if the URL had a trailing slash, pop() would return '' and the ARN would be invalid.
  // AWS SQS URLs don't have trailing slashes in practice, so this is safe for real data.
  it('builds SQS queue ARN from HTTP URL physical ID', () => {
    const result = resolveOutputs({
      template: makeGetAttTemplate('MyQueue', 'AWS::SQS::Queue'),
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyQueue',
          PhysicalResourceId: 'https://sqs.us-east-1.amazonaws.com/123/my-queue',
          ResourceType: 'AWS::SQS::Queue',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
      region: 'us-east-1',
      accountId: '123',
    });
    expect(result.Resources.Consumer.Properties.Arn).toBe('arn:aws:sqs:us-east-1:123:my-queue');
  });

  it('builds Lambda function ARN', () => {
    const result = resolveOutputs({
      template: makeGetAttTemplate('MyFunc', 'AWS::Lambda::Function'),
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyFunc',
          PhysicalResourceId: 'my-function',
          ResourceType: 'AWS::Lambda::Function',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
      region: 'us-east-1',
      accountId: '123',
    });
    expect(result.Resources.Consumer.Properties.Arn).toBe('arn:aws:lambda:us-east-1:123:function:my-function');
  });

  it('passes through Kinesis stream ARN when physical ID is already an ARN', () => {
    const kinesisArn = 'arn:aws:kinesis:us-east-1:123:stream/my-stream';
    const result = resolveOutputs({
      template: makeGetAttTemplate('MyStream', 'AWS::Kinesis::Stream'),
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyStream',
          PhysicalResourceId: kinesisArn,
          ResourceType: 'AWS::Kinesis::Stream',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
      region: 'us-east-1',
      accountId: '123',
    });
    expect(result.Resources.Consumer.Properties.Arn).toBe(kinesisArn);
  });

  it('falls back to raw physical resource ID for unknown resource types', () => {
    const topicArn = 'arn:aws:sns:us-east-1:123:my-topic';
    const result = resolveOutputs({
      template: makeGetAttTemplate('MyTopic', 'AWS::SNS::Topic'),
      stackOutputs: [],
      stackResources: [
        { LogicalResourceId: 'MyTopic', PhysicalResourceId: topicArn, ResourceType: 'AWS::SNS::Topic', Timestamp: ts, ResourceStatus: rs },
      ],
      region: 'us-east-1',
      accountId: '123',
    });
    // buildArn returns undefined for SNS → fallback to physicalId
    expect(result.Resources.Consumer.Properties.Arn).toBe(topicArn);
  });
});

describe('resolveOutputs - error paths', () => {
  it('throws when a stack output has no runtime value', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: { Bucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
      Outputs: { BucketOutput: { Value: { Ref: 'Bucket' } } },
    };
    expect(() => resolveOutputs({ template, stackOutputs: [], stackResources: [], region: 'us-east-1', accountId: '123' })).toThrow(
      "Stack output 'BucketOutput' has no runtime value",
    );
  });

  it('throws when template is missing Outputs or Resources', () => {
    expect(() =>
      resolveOutputs({ template: { Resources: {} } as any, stackOutputs: [], stackResources: [], region: 'us-east-1', accountId: '123' }),
    ).toThrow('missing Outputs or Resources');
  });
});
