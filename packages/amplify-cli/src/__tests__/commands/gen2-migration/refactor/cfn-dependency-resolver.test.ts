import { resolveDependencies } from '../../../../commands/gen2-migration/refactor/resolvers/cfn-dependency-resolver';
import { CFNTemplate } from '../../../../commands/gen2-migration/refactor/cfn-template';

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

  it('handles string DependsOn (not array) for staying resources', () => {
    const template = makeTemplate({
      Staying: { Type: 'AWS::Lambda::Function', DependsOn: 'Moving' },
      Moving: { Type: 'AWS::S3::Bucket' },
    });

    const result = resolveDependencies(template, ['Moving']);
    // String normalized to array, then filtered — result is empty array (not undefined)
    expect(result.Resources.Staying.DependsOn).toEqual([]);
  });

  it('leaves DependsOn unchanged when all resources are moving together', () => {
    const template = makeTemplate({
      A: { Type: 'AWS::S3::Bucket', DependsOn: ['B'] },
      B: { Type: 'AWS::S3::BucketPolicy', DependsOn: ['C'] },
      C: { Type: 'AWS::IAM::Role' },
    });

    const result = resolveDependencies(template, ['A', 'B', 'C']);
    // Neither filter condition triggers — deps.length === depsInRefactor.length for all
    expect(result.Resources.A.DependsOn).toEqual(['B']);
    expect(result.Resources.B.DependsOn).toEqual(['C']);
    expect(result.Resources.C.DependsOn).toBeUndefined();
  });
});
