import { resolveParameters } from '../../../../commands/gen2-migration/refactor-new/resolvers/cfn-parameter-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor-new/cfn-template';

const baseTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: {
    MyBucket: {
      Type: 'AWS::S3::Bucket',
      Properties: { BucketName: { Ref: 'BucketNameParam' } },
    },
  },
  Parameters: {
    BucketNameParam: { Type: 'String' },
    ListParam: { Type: 'CommaDelimitedList' },
    SecretParam: { Type: 'String', NoEcho: true },
  },
  Outputs: {},
};

describe('resolveParameters', () => {
  it('resolves Ref nodes with parameter values', () => {
    const result = resolveParameters(baseTemplate, [{ ParameterKey: 'BucketNameParam', ParameterValue: 'my-bucket' }]);
    expect(result.Resources.MyBucket.Properties.BucketName).toBe('my-bucket');
  });

  it('splits CommaDelimitedList values into arrays', () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        MyResource: { Type: 'AWS::Lambda::Function', Properties: { Zones: { Ref: 'ListParam' } } },
      },
    };
    const result = resolveParameters(template, [{ ParameterKey: 'ListParam', ParameterValue: 'a,b,c' }]);
    expect(result.Resources.MyResource.Properties.Zones).toEqual(['a', 'b', 'c']);
  });

  it('skips NoEcho parameters', () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        MyResource: { Type: 'AWS::Lambda::Function', Properties: { Secret: { Ref: 'SecretParam' } } },
      },
    };
    const result = resolveParameters(template, [{ ParameterKey: 'SecretParam', ParameterValue: 'secret-value' }]);
    // NoEcho param is NOT resolved — Ref remains
    expect(result.Resources.MyResource.Properties.Secret).toEqual({ Ref: 'SecretParam' });
  });

  it('resolves AWS::StackName pseudo-parameter when stackName is provided', () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        MyResource: { Type: 'AWS::Lambda::Function', Properties: { Name: { Ref: 'AWS::StackName' } } },
      },
    };
    const result = resolveParameters(template, [], 'my-stack-name');
    expect(result.Resources.MyResource.Properties.Name).toBe('my-stack-name');
  });

  it('returns template unchanged when no parameters match', () => {
    const result = resolveParameters(baseTemplate, []);
    expect(result).toBe(baseTemplate); // Same reference — no clone needed
  });
});
