import { resolveDependencies } from '../../../../commands/gen2-migration/refactor-new/resolvers/cfn-dependency-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor-new/cfn-template';

const makeTemplate = (resources: Record<string, { Type: string; DependsOn?: string | string[] }>): CFNTemplate => ({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: Object.fromEntries(Object.entries(resources).map(([k, v]) => [k, { ...v, Properties: {} }])),
  Outputs: {},
});

describe('resolveDependencies', () => {
  it('removes cross-boundary DependsOn from staying resources', () => {
    const template = makeTemplate({
      StayingResource: { Type: 'AWS::Lambda::Function', DependsOn: ['MovingResource', 'OtherStaying'] },
      MovingResource: { Type: 'AWS::S3::Bucket' },
      OtherStaying: { Type: 'AWS::IAM::Role' },
    });

    const result = resolveDependencies(template, ['MovingResource']);
    // StayingResource should no longer depend on MovingResource
    expect(result.Resources.StayingResource.DependsOn).toEqual(['OtherStaying']);
  });

  it('keeps within-boundary DependsOn for moving resources', () => {
    const template = makeTemplate({
      MovingA: { Type: 'AWS::S3::Bucket', DependsOn: ['MovingB', 'StayingResource'] },
      MovingB: { Type: 'AWS::S3::BucketPolicy' },
      StayingResource: { Type: 'AWS::Lambda::Function' },
    });

    const result = resolveDependencies(template, ['MovingA', 'MovingB']);
    // MovingA keeps dep on MovingB (both moving), loses dep on StayingResource
    expect(result.Resources.MovingA.DependsOn).toEqual(['MovingB']);
  });

  it('passes through resources without DependsOn unchanged', () => {
    const template = makeTemplate({
      NoDeps: { Type: 'AWS::S3::Bucket' },
      Moving: { Type: 'AWS::DynamoDB::Table' },
    });

    const result = resolveDependencies(template, ['Moving']);
    expect(result.Resources.NoDeps.DependsOn).toBeUndefined();
  });
});
