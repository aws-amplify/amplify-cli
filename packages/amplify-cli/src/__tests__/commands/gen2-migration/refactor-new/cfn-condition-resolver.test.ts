import { resolveConditions } from '../../../../commands/gen2-migration/refactor-new/resolvers/cfn-condition-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor-new/cfn-template';

describe('resolveConditions - Fn::If scope', () => {
  const parameters = [{ ParameterKey: 'EnvType', ParameterValue: 'prod' }];

  const makeTemplate = (properties: Record<string, string | number | object>): CFNTemplate => ({
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'test',
    Conditions: {
      IsProd: { 'Fn::Equals': [{ Ref: 'EnvType' }, 'prod'] },
    },
    Resources: {
      MyBucket: { Type: 'AWS::S3::Bucket', Properties: properties },
    },
    Outputs: {},
  });

  /**
   * INTENTIONAL: Fn::If is resolved only at the top level of resource properties.
   *
   * The old code's resolveConditionInResources checks each property value for Fn::If
   * but does NOT recurse into nested objects. This means Fn::If inside Fn::Join,
   * Fn::Select, or other intrinsic functions is left unresolved.
   *
   * This is a known limitation preserved for snapshot compatibility. If recursive
   * resolution is enabled in the future, this test should be updated to expect
   * the resolved value instead.
   */
  it('resolves top-level Fn::If in a property', () => {
    const template = makeTemplate({
      BucketName: { 'Fn::If': ['IsProd', 'prod-bucket', 'dev-bucket'] },
    });

    const result = resolveConditions(template, parameters);
    expect(result.Resources.MyBucket.Properties.BucketName).toBe('prod-bucket');
  });

  it('does NOT resolve Fn::If nested inside Fn::Join (shallow resolution)', () => {
    const template = makeTemplate({
      BucketName: {
        'Fn::Join': ['-', ['prefix', { 'Fn::If': ['IsProd', 'prod', 'dev'] }, 'suffix']],
      },
    });

    const result = resolveConditions(template, parameters);
    // The nested Fn::If is NOT resolved — it remains as-is inside Fn::Join
    const bucketName = result.Resources.MyBucket.Properties.BucketName as Record<string, unknown>;
    expect(bucketName['Fn::Join']).toBeDefined();
    const joinArgs = bucketName['Fn::Join'] as [string, unknown[]];
    const nestedIf = joinArgs[1][1] as Record<string, unknown>;
    expect(nestedIf['Fn::If']).toEqual(['IsProd', 'prod', 'dev']);
  });

  it('resolves top-level Fn::If in array elements', () => {
    const template = makeTemplate({
      Tags: [{ 'Fn::If': ['IsProd', { Key: 'env', Value: 'prod' }, { Key: 'env', Value: 'dev' }] }],
    });

    const result = resolveConditions(template, parameters);
    const tags = result.Resources.MyBucket.Properties.Tags as Array<Record<string, string>>;
    expect(tags[0]).toEqual({ Key: 'env', Value: 'prod' });
  });

  it('removes resources with unmet conditions', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'EnvType' }, 'prod'] },
        IsDev: { 'Fn::Equals': [{ Ref: 'EnvType' }, 'dev'] },
      },
      Resources: {
        ProdBucket: { Type: 'AWS::S3::Bucket', Properties: {}, Condition: 'IsProd' },
        DevBucket: { Type: 'AWS::S3::Bucket', Properties: {}, Condition: 'IsDev' },
        AlwaysBucket: { Type: 'AWS::S3::Bucket', Properties: {} },
      },
      Outputs: {},
    };

    const result = resolveConditions(template, parameters);
    expect(result.Resources.ProdBucket).toBeDefined();
    expect(result.Resources.DevBucket).toBeUndefined();
    expect(result.Resources.AlwaysBucket).toBeDefined();
  });
});
