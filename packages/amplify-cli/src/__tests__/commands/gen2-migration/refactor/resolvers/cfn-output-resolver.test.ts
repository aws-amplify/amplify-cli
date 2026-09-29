import { resolveOutputs } from '../../../../../commands/gen2-migration/refactor/resolvers/cfn-output-resolver';
import { CFNTemplate } from '../../../../../commands/gen2-migration/_common/cfn-template';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';

let cloudControlMock: ReturnType<typeof mockClient>;

beforeEach(() => {
  cloudControlMock = mockClient(CloudControlClient);
});
afterEach(() => cloudControlMock.restore());

function createCloudControlClient() {
  return new CloudControlClient({});
}

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
  it('resolves Ref-based output references in Resources', async () => {
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
    cloudControlMock.on(GetResourceCommand).resolves({
      ResourceDescription: { Properties: '{}' },
    });
    const result = await resolveOutputs({
      template,
      stackOutputs: [{ OutputKey: 'UserPoolIdOutput', OutputValue: 'us-east-1_ABC' }],
      stackResources: [],
      cloudControl: createCloudControlClient(),
    });
    expect(result.Resources.Consumer.Properties.PoolId).toBe('us-east-1_ABC');
  });

  it('resolves GetAtt references using CloudControl', async () => {
    cloudControlMock.on(GetResourceCommand).resolves({
      ResourceDescription: { Properties: JSON.stringify({ Arn: 'arn:aws:cognito-idp:us-east-1:123456789:userpool/us-east-1_ABC' }) },
    });
    const result = await resolveOutputs({
      template: baseTemplate,
      stackOutputs: [
        { OutputKey: 'UserPoolIdOutput', OutputValue: 'us-east-1_ABC' },
        { OutputKey: 'UserPoolArnOutput', OutputValue: 'arn:aws:cognito-idp:us-east-1:123456789:userpool/us-east-1_ABC' },
      ],
      stackResources: [
        {
          LogicalResourceId: 'UserPool',
          PhysicalResourceId: 'us-east-1_ABC',
          ResourceType: 'AWS::Cognito::UserPool',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
      cloudControl: createCloudControlClient(),
    });
    expect(result.Resources.S3Bucket.Properties.Arn).toBe('arn:aws:cognito-idp:us-east-1:123456789:userpool/us-east-1_ABC');
  });

  it('falls back to physical resource ID for GetAtt when CloudControl returns no matching attr', async () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyRole: { Type: 'AWS::IAM::Role', Properties: {} },
        Consumer: { Type: 'AWS::Lambda::Function', Properties: { RoleArn: { 'Fn::GetAtt': ['MyRole', 'Arn'] } } },
      },
      Outputs: {},
    };
    cloudControlMock.on(GetResourceCommand).resolves({
      ResourceDescription: { Properties: JSON.stringify({ Arn: 'arn:aws:iam::123:role/my-role' }) },
    });
    const result = await resolveOutputs({
      template,
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyRole',
          PhysicalResourceId: 'arn:aws:iam::123:role/my-role',
          ResourceType: 'AWS::IAM::Role',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
      cloudControl: createCloudControlClient(),
    });
    expect(result.Resources.Consumer.Properties.RoleArn).toBe('arn:aws:iam::123:role/my-role');
  });

  it('replaces Output values with runtime stack output values', async () => {
    cloudControlMock.on(GetResourceCommand).resolves({
      ResourceDescription: { Properties: JSON.stringify({ Arn: 'arn:aws:cognito-idp:us-east-1:123:userpool/ABC' }) },
    });
    const result = await resolveOutputs({
      template: baseTemplate,
      stackOutputs: [
        { OutputKey: 'UserPoolIdOutput', OutputValue: 'us-east-1_ABC' },
        { OutputKey: 'UserPoolArnOutput', OutputValue: 'arn:aws:cognito-idp:us-east-1:123:userpool/ABC' },
      ],
      stackResources: [
        {
          LogicalResourceId: 'UserPool',
          PhysicalResourceId: 'us-east-1_ABC',
          ResourceType: 'AWS::Cognito::UserPool',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
      cloudControl: createCloudControlClient(),
    });
    expect(result.Outputs!.UserPoolIdOutput.Value).toBe('us-east-1_ABC');
    expect(result.Outputs!.UserPoolArnOutput.Value).toBe('arn:aws:cognito-idp:us-east-1:123:userpool/ABC');
  });

  it('skips GetAtt resolution for Custom:: resources', async () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyCustom: { Type: 'Custom::MyResource', Properties: {} },
        Consumer: { Type: 'AWS::Lambda::Function', Properties: { Value: { 'Fn::GetAtt': ['MyCustom', 'OutputKey'] } } },
      },
      Outputs: {},
    };
    const result = await resolveOutputs({
      template,
      stackOutputs: [],
      stackResources: [
        {
          LogicalResourceId: 'MyCustom',
          PhysicalResourceId: 'custom-id',
          ResourceType: 'Custom::MyResource',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
      cloudControl: createCloudControlClient(),
    });
    // Custom resource GetAtt should remain unresolved
    expect(result.Resources.Consumer.Properties.Value).toEqual({ 'Fn::GetAtt': ['MyCustom', 'OutputKey'] });
  });
});

describe('resolveOutputs - error paths', () => {
  it('throws when a stack output has no runtime value', async () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: { Bucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
      Outputs: { BucketOutput: { Value: { Ref: 'Bucket' } } },
    };
    await expect(
      resolveOutputs({ template, stackOutputs: [], stackResources: [], cloudControl: createCloudControlClient() }),
    ).rejects.toThrow("Stack output 'BucketOutput' has no runtime value");
  });

  it('throws when template is missing Resources', async () => {
    await expect(
      resolveOutputs({ template: {} as any, stackOutputs: [], stackResources: [], cloudControl: createCloudControlClient() }),
    ).rejects.toThrow('missing Resources');
  });

  it('works when template has Resources but no Outputs section', async () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {
        MyTable: { Type: 'AWS::DynamoDB::Table', Properties: {} },
      },
    };
    const result = await resolveOutputs({
      template,
      stackOutputs: [],
      stackResources: [],
      cloudControl: createCloudControlClient(),
    });
    // Should return the template unchanged (no outputs to resolve)
    expect(result.Resources.MyTable.Type).toBe('AWS::DynamoDB::Table');
    expect(result.Outputs).toBeUndefined();
  });
});
