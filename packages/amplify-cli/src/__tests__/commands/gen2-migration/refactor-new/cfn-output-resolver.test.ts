import { resolveOutputs } from '../../../../commands/gen2-migration/refactor-new/resolvers/cfn-output-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor-new/cfn-template';

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
