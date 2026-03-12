import { resolveConditions } from '../../../../commands/gen2-migration/refactor/resolvers/cfn-condition-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor/cfn-template';

/**
 * Builds a template with one condition gating one resource.
 * The resource survives if the condition evaluates to true, is removed if false.
 */
const makeConditionTemplate = (conditionDef: object, parameters?: Record<string, { Type: string }>): CFNTemplate => ({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  ...(parameters ? { Parameters: parameters } : {}),
  Conditions: { TestCondition: conditionDef as any },
  Resources: {
    Gated: { Type: 'AWS::S3::Bucket', Properties: {}, Condition: 'TestCondition' },
    Ungated: { Type: 'AWS::S3::Bucket', Properties: {} },
  },
  Outputs: {},
});

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

describe('resolveConditions - condition functions', () => {
  const params = { Env: { Type: 'String' } };

  it('Fn::Not negates a true condition', () => {
    const template = makeConditionTemplate({ 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] }] }, params);
    const result = resolveConditions(template, [{ ParameterKey: 'Env', ParameterValue: 'prod' }]);
    // Fn::Equals is true, Fn::Not makes it false → resource removed
    expect(result.Resources.Gated).toBeUndefined();
  });

  it('Fn::Not negates a false condition', () => {
    const template = makeConditionTemplate({ 'Fn::Not': [{ 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] }] }, params);
    const result = resolveConditions(template, [{ ParameterKey: 'Env', ParameterValue: 'dev' }]);
    // Fn::Equals is false, Fn::Not makes it true → resource survives
    expect(result.Resources.Gated).toBeDefined();
  });

  it('Fn::Or is true when one operand is true', () => {
    const template = makeConditionTemplate(
      { 'Fn::Or': [{ 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] }, { 'Fn::Equals': [{ Ref: 'Env' }, 'staging'] }] },
      params,
    );
    const result = resolveConditions(template, [{ ParameterKey: 'Env', ParameterValue: 'prod' }]);
    expect(result.Resources.Gated).toBeDefined();
  });

  it('Fn::Or is false when both operands are false', () => {
    const template = makeConditionTemplate(
      { 'Fn::Or': [{ 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] }, { 'Fn::Equals': [{ Ref: 'Env' }, 'staging'] }] },
      params,
    );
    const result = resolveConditions(template, [{ ParameterKey: 'Env', ParameterValue: 'dev' }]);
    expect(result.Resources.Gated).toBeUndefined();
  });

  it('Fn::And is true when both operands are true', () => {
    const twoParams = { Env: { Type: 'String' }, Region: { Type: 'String' } };
    const template = makeConditionTemplate(
      { 'Fn::And': [{ 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] }, { 'Fn::Equals': [{ Ref: 'Region' }, 'us-east-1'] }] },
      twoParams,
    );
    const result = resolveConditions(template, [
      { ParameterKey: 'Env', ParameterValue: 'prod' },
      { ParameterKey: 'Region', ParameterValue: 'us-east-1' },
    ]);
    expect(result.Resources.Gated).toBeDefined();
  });

  it('Fn::And is false when one operand is false', () => {
    const twoParams = { Env: { Type: 'String' }, Region: { Type: 'String' } };
    const template = makeConditionTemplate(
      { 'Fn::And': [{ 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] }, { 'Fn::Equals': [{ Ref: 'Region' }, 'us-east-1'] }] },
      twoParams,
    );
    const result = resolveConditions(template, [
      { ParameterKey: 'Env', ParameterValue: 'prod' },
      { ParameterKey: 'Region', ParameterValue: 'eu-west-1' },
    ]);
    expect(result.Resources.Gated).toBeUndefined();
  });

  it('resolves nested condition references ({ Condition: "X" })', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Parameters: { Env: { Type: 'String' } },
      Conditions: {
        IsProd: { 'Fn::Equals': [{ Ref: 'Env' }, 'prod'] } as any,
        NotProd: { 'Fn::Not': [{ Condition: 'IsProd' }] } as any,
      },
      Resources: {
        ProdOnly: { Type: 'AWS::S3::Bucket', Properties: {}, Condition: 'IsProd' },
        NonProdOnly: { Type: 'AWS::S3::Bucket', Properties: {}, Condition: 'NotProd' },
      },
      Outputs: {},
    };
    const result = resolveConditions(template, [{ ParameterKey: 'Env', ParameterValue: 'prod' }]);
    expect(result.Resources.ProdOnly).toBeDefined();
    expect(result.Resources.NonProdOnly).toBeUndefined();
  });
});

describe('resolveConditions - edge cases', () => {
  it('returns template unchanged when no Conditions section', () => {
    const template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: { Bucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
      Outputs: {},
    };
    const result = resolveConditions(template, []);
    expect(result).toBe(template); // Same reference — no clone
  });

  it('throws when condition references a parameter with no value', () => {
    const template = makeConditionTemplate({ 'Fn::Equals': [{ Ref: 'MissingParam' }, 'x'] }, { MissingParam: { Type: 'String' } });
    expect(() => resolveConditions(template, [])).toThrow("Condition references parameter 'MissingParam'");
  });

  it('throws on unsupported condition statement', () => {
    const template = makeConditionTemplate({ 'Fn::Equals': [{ 'Fn::Select': [0, ['a', 'b']] }, 'a'] }, {});
    expect(() => resolveConditions(template, [])).toThrow('Unsupported condition statement');
  });
});
