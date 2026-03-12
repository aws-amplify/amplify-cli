import { resolveParameters } from '../../../../commands/gen2-migration/refactor/resolvers/cfn-parameter-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor/cfn-template';

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

  it('splits List<Number> values into arrays', () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Parameters: { ...baseTemplate.Parameters, NumList: { Type: 'List<Number>' } },
      Resources: { R: { Type: 'AWS::Lambda::Function', Properties: { Nums: { Ref: 'NumList' } } } },
    };
    const result = resolveParameters(template, [{ ParameterKey: 'NumList', ParameterValue: '1,2,3' }]);
    expect(result.Resources.R.Properties.Nums).toEqual(['1', '2', '3']);
  });

  it('resolves refs nested inside arrays', () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        R: { Type: 'AWS::Lambda::Function', Properties: { Tags: [{ Key: 'env', Value: { Ref: 'BucketNameParam' } }] } },
      },
    };
    const result = resolveParameters(template, [{ ParameterKey: 'BucketNameParam', ParameterValue: 'prod' }]);
    expect((result.Resources.R.Properties.Tags as any[])[0].Value).toBe('prod');
  });

  it('skips parameters not defined in template Parameters section', () => {
    const result = resolveParameters(baseTemplate, [{ ParameterKey: 'Unknown', ParameterValue: 'val' }]);
    // Unknown param has no entry in template.Parameters → skipped, Ref stays
    expect(result.Resources.MyBucket.Properties.BucketName).toEqual({ Ref: 'BucketNameParam' });
  });

  it('throws when parameter has no ParameterKey', () => {
    expect(() => resolveParameters(baseTemplate, [{ ParameterKey: undefined, ParameterValue: 'x' } as any])).toThrow(
      'Encountered a stack parameter with no ParameterKey',
    );
  });

  it('wraps single-value CommaDelimitedList in array', () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: { R: { Type: 'AWS::Lambda::Function', Properties: { Zones: { Ref: 'ListParam' } } } },
    };
    const result = resolveParameters(template, [{ ParameterKey: 'ListParam', ParameterValue: 'single' }]);
    expect(result.Resources.R.Properties.Zones).toEqual(['single']);
  });
});
