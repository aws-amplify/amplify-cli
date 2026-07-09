import { resolveDependencies } from '../../../../../commands/gen2-migration/refactor/resolvers/cfn-dependency-resolver';
import { CFNTemplate } from '../../../../../commands/gen2-migration/_common/cfn-template';

const makeTemplate = (resources: Record<string, { Type: string; DependsOn?: string | string[] }>): CFNTemplate => ({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: Object.fromEntries(Object.entries(resources).map(([k, v]) => [k, { ...v, Properties: {} }])),
  Outputs: {},
});

describe('resolveDependencies', () => {
  it('strips all DependsOn from every resource', () => {
    const template = makeTemplate({
      StayingResource: { Type: 'AWS::Lambda::Function', DependsOn: ['MovingResource', 'OtherStaying'] },
      MovingResource: { Type: 'AWS::S3::Bucket' },
      OtherStaying: { Type: 'AWS::IAM::Role', DependsOn: 'MovingResource' },
    });

    const result = resolveDependencies(template);
    expect(result.Resources.StayingResource.DependsOn).toBeUndefined();
    expect(result.Resources.MovingResource.DependsOn).toBeUndefined();
    expect(result.Resources.OtherStaying.DependsOn).toBeUndefined();
  });

  it('passes through resources without DependsOn unchanged', () => {
    const template = makeTemplate({
      NoDeps: { Type: 'AWS::S3::Bucket' },
      AlsoNoDeps: { Type: 'AWS::DynamoDB::Table' },
    });

    const result = resolveDependencies(template);
    expect(result.Resources.NoDeps.DependsOn).toBeUndefined();
    expect(result.Resources.AlsoNoDeps.DependsOn).toBeUndefined();
  });

  it('does not mutate the input template', () => {
    const template = makeTemplate({
      A: { Type: 'AWS::S3::Bucket', DependsOn: ['B'] },
      B: { Type: 'AWS::S3::BucketPolicy' },
    });

    resolveDependencies(template);
    expect(template.Resources.A.DependsOn).toEqual(['B']);
  });
});
