import { resolveParameters } from '../../../../../commands/gen2-migration/refactor/resolvers/cfn-parameter-resolver';
import { CFNTemplate } from '../../../../../commands/gen2-migration/_common/cfn-template';

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
  it('resolves Ref nodes with parameter values', async () => {
    const result = await resolveParameters(baseTemplate, [{ ParameterKey: 'BucketNameParam', ParameterValue: 'my-bucket' }]);
    expect(result.Resources.MyBucket.Properties.BucketName).toBe('my-bucket');
  });

  it('splits CommaDelimitedList values into arrays', async () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        MyResource: { Type: 'AWS::Lambda::Function', Properties: { Zones: { Ref: 'ListParam' } } },
      },
    };
    const result = await resolveParameters(template, [{ ParameterKey: 'ListParam', ParameterValue: 'a,b,c' }]);
    expect(result.Resources.MyResource.Properties.Zones).toEqual(['a', 'b', 'c']);
  });

  it('skips NoEcho parameters', async () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        MyResource: { Type: 'AWS::Lambda::Function', Properties: { Secret: { Ref: 'SecretParam' } } },
      },
    };
    const result = await resolveParameters(template, [{ ParameterKey: 'SecretParam', ParameterValue: 'secret-value' }]);
    // NoEcho param is NOT resolved — Ref remains
    expect(result.Resources.MyResource.Properties.Secret).toEqual({ Ref: 'SecretParam' });
  });

  it('resolves AWS::StackName pseudo-parameter when stackName is provided', async () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        MyResource: { Type: 'AWS::Lambda::Function', Properties: { Name: { Ref: 'AWS::StackName' } } },
      },
    };
    const result = await resolveParameters(template, [], 'my-stack-name');
    expect(result.Resources.MyResource.Properties.Name).toBe('my-stack-name');
  });

  it('returns template unchanged when no parameters match', async () => {
    const result = await resolveParameters(baseTemplate, []);
    expect(result).toBe(baseTemplate); // Same reference — no clone needed
  });

  it('splits List<Number> values into arrays', async () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Parameters: { ...baseTemplate.Parameters, NumList: { Type: 'List<Number>' } },
      Resources: { R: { Type: 'AWS::Lambda::Function', Properties: { Nums: { Ref: 'NumList' } } } },
    };
    const result = await resolveParameters(template, [{ ParameterKey: 'NumList', ParameterValue: '1,2,3' }]);
    expect(result.Resources.R.Properties.Nums).toEqual(['1', '2', '3']);
  });

  it('resolves refs nested inside arrays', async () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: {
        R: { Type: 'AWS::Lambda::Function', Properties: { Tags: [{ Key: 'env', Value: { Ref: 'BucketNameParam' } }] } },
      },
    };
    const result = await resolveParameters(template, [{ ParameterKey: 'BucketNameParam', ParameterValue: 'prod' }]);
    expect((result.Resources.R.Properties.Tags as any[])[0].Value).toBe('prod');
  });

  it('skips parameters not defined in template Parameters section', async () => {
    const result = await resolveParameters(baseTemplate, [{ ParameterKey: 'Unknown', ParameterValue: 'val' }]);
    // Unknown param has no entry in template.Parameters → skipped, Ref stays
    expect(result.Resources.MyBucket.Properties.BucketName).toEqual({ Ref: 'BucketNameParam' });
  });

  it('throws when parameter has no ParameterKey', async () => {
    await expect(resolveParameters(baseTemplate, [{ ParameterKey: undefined, ParameterValue: 'x' } as any])).rejects.toThrow(
      'Encountered a stack parameter with no ParameterKey',
    );
  });

  it('wraps single-value CommaDelimitedList in array', async () => {
    const template: CFNTemplate = {
      ...baseTemplate,
      Resources: { R: { Type: 'AWS::Lambda::Function', Properties: { Zones: { Ref: 'ListParam' } } } },
    };
    const result = await resolveParameters(template, [{ ParameterKey: 'ListParam', ParameterValue: 'single' }]);
    expect(result.Resources.R.Properties.Zones).toEqual(['single']);
  });
});
