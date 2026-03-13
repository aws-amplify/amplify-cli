import CFNConditionResolver from '../../../../../../commands/gen2-migration/generate-new/amplify/analytics/cfn-condition-resolver';
import { Parameter } from '@aws-sdk/client-cloudformation';

function params(...entries: Array<[string, string]>): Parameter[] {
  return entries.map(([key, value]) => ({ ParameterKey: key, ParameterValue: value }));
}

describe('CFNConditionResolver', () => {
  it('returns the template unchanged when there are no conditions', () => {
    const template = { Resources: { MyBucket: { Type: 'AWS::S3::Bucket' } } };
    const resolver = new CFNConditionResolver(template);
    const result = resolver.resolve([]);
    expect(result.Resources.MyBucket).toBeDefined();
  });

  it('resolves Fn::Equals to true when values match', () => {
    const template = {
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'env' }, 'prod'] },
      },
      Resources: {
        ProdOnly: { Type: 'AWS::S3::Bucket', Condition: 'IsProd' },
      },
    };
    const resolver = new CFNConditionResolver(template);
    const result = resolver.resolve(params(['env', 'prod']));
    expect(result.Resources.ProdOnly).toBeDefined();
  });

  it('resolves Fn::Equals to false and removes the resource', () => {
    const template = {
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'env' }, 'prod'] },
      },
      Resources: {
        ProdOnly: { Type: 'AWS::S3::Bucket', Condition: 'IsProd' },
      },
    };
    const resolver = new CFNConditionResolver(template);
    const result = resolver.resolve(params(['env', 'dev']));
    expect(result.Resources.ProdOnly).toBeUndefined();
  });

  it('resolves Fn::Not', () => {
    const template = {
      Conditions: {
        NotProd: { 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'env' }, 'prod'] }] },
      },
      Resources: {
        DevOnly: { Type: 'AWS::S3::Bucket', Condition: 'NotProd' },
      },
    };
    const resolver = new CFNConditionResolver(template);

    const devResult = resolver.resolve(params(['env', 'dev']));
    expect(devResult.Resources.DevOnly).toBeDefined();

    const prodResult = new CFNConditionResolver(template).resolve(params(['env', 'prod']));
    expect(prodResult.Resources.DevOnly).toBeUndefined();
  });

  it('resolves Fn::Or', () => {
    const template = {
      Conditions: {
        IsDevOrStaging: {
          'Fn::Or': [{ 'Fn::Equals': [{ Ref: 'env' }, 'dev'] }, { 'Fn::Equals': [{ Ref: 'env' }, 'staging'] }],
        },
      },
      Resources: {
        NonProd: { Type: 'AWS::S3::Bucket', Condition: 'IsDevOrStaging' },
      },
    };
    const resolver = new CFNConditionResolver(template);
    const result = resolver.resolve(params(['env', 'dev']));
    expect(result.Resources.NonProd).toBeDefined();
  });

  it('resolves Fn::And', () => {
    const template = {
      Conditions: {
        BothTrue: {
          'Fn::And': [{ 'Fn::Equals': [{ Ref: 'a' }, 'yes'] }, { 'Fn::Equals': [{ Ref: 'b' }, 'yes'] }],
        },
      },
      Resources: {
        BothResource: { Type: 'AWS::S3::Bucket', Condition: 'BothTrue' },
      },
    };
    const resolver = new CFNConditionResolver(template);

    const bothYes = resolver.resolve(params(['a', 'yes'], ['b', 'yes']));
    expect(bothYes.Resources.BothResource).toBeDefined();

    const onlyOne = new CFNConditionResolver(template).resolve(params(['a', 'yes'], ['b', 'no']));
    expect(onlyOne.Resources.BothResource).toBeUndefined();
  });

  it('resolves Fn::If in resource properties', () => {
    const template = {
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'env' }, 'prod'] },
      },
      Resources: {
        MyBucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {
            BucketName: { 'Fn::If': ['IsProd', 'prod-bucket', 'dev-bucket'] },
          },
        },
      },
    };
    const resolver = new CFNConditionResolver(template);

    const prodResult = resolver.resolve(params(['env', 'prod']));
    expect(prodResult.Resources.MyBucket.Properties.BucketName).toBe('prod-bucket');

    const devResult = new CFNConditionResolver(template).resolve(params(['env', 'dev']));
    expect(devResult.Resources.MyBucket.Properties.BucketName).toBe('dev-bucket');
  });

  it('preserves resources without conditions', () => {
    const template = {
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'env' }, 'prod'] },
      },
      Resources: {
        Always: { Type: 'AWS::S3::Bucket', Properties: {} },
        ProdOnly: { Type: 'AWS::S3::Bucket', Condition: 'IsProd' },
      },
    };
    const resolver = new CFNConditionResolver(template);
    const result = resolver.resolve(params(['env', 'dev']));
    expect(result.Resources.Always).toBeDefined();
    expect(result.Resources.ProdOnly).toBeUndefined();
  });

  it('resolves nested condition references', () => {
    const template = {
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'env' }, 'prod'] },
        NotProd: { 'Fn::Not': [{ Condition: 'IsProd' }] },
      },
      Resources: {
        DevOnly: { Type: 'AWS::S3::Bucket', Condition: 'NotProd' },
      },
    };
    const resolver = new CFNConditionResolver(template);
    const result = resolver.resolve(params(['env', 'prod']));
    expect(result.Resources.DevOnly).toBeUndefined();
  });

  it('does not mutate the original template', () => {
    const template = {
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'env' }, 'prod'] },
      },
      Resources: {
        ProdOnly: { Type: 'AWS::S3::Bucket', Condition: 'IsProd' },
      },
    };
    const resolver = new CFNConditionResolver(template);
    resolver.resolve(params(['env', 'dev']));
    expect(template.Resources.ProdOnly).toBeDefined();
  });
});
