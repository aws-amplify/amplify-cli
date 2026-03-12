import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/refactor-new/cfn-template';
import {
  CategoryRefactorer,
  ResolvedStack,
  MIGRATION_PLACEHOLDER_LOGICAL_ID,
} from '../../../../commands/gen2-migration/refactor-new/workflow/category-refactorer';

// Minimal concrete subclass to access protected methods
class TestRefactorer extends (CategoryRefactorer as any) {
  constructor() {
    super(null, null, null, 'us-east-1', '123');
  }
  public testBuildRefactorTemplates(source: ResolvedStack, postTargetTemplate: CFNTemplate, logicalIdMap: Map<string, string>) {
    return (this as any).buildRefactorTemplates(source, postTargetTemplate, logicalIdMap);
  }
  public testAddPlaceholderIfNeeded(resolvedTemplate: CFNTemplate, resourcesToMove: Map<string, CFNResource>) {
    return (this as any).addPlaceholderIfNeeded(resolvedTemplate, resourcesToMove);
  }
  protected async fetchSourceStackId() {
    return undefined;
  }
  protected async fetchDestStackId() {
    return undefined;
  }
  protected resourceTypes() {
    return [];
  }
  protected buildResourceMappings() {
    return new Map();
  }
  protected resolveSource() {
    return Promise.resolve({} as any);
  }
  protected resolveTarget() {
    return Promise.resolve({} as any);
  }
  protected beforeMovePlan() {
    return { operations: [], postTargetTemplate: {} as any };
  }
  protected async afterMovePlan() {
    return { operations: [] };
  }
}

const makeTemplate = (resources: Record<string, CFNResource>): CFNTemplate => ({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: resources,
  Outputs: {},
});

describe('buildRefactorTemplates', () => {
  const refactorer = new TestRefactorer();

  it('removes resources from source and adds them to target with remapped IDs', () => {
    const sourceResources = new Map<string, CFNResource>([
      ['S3Bucket', { Type: 'AWS::S3::Bucket', Properties: { BucketName: 'my-bucket' } }],
    ]);
    const source: ResolvedStack = {
      stackId: 'source-stack',
      originalTemplate: makeTemplate({
        S3Bucket: sourceResources.get('S3Bucket')!,
        OtherResource: { Type: 'AWS::Lambda::Function', Properties: {} },
      }),
      resolvedTemplate: makeTemplate({
        S3Bucket: sourceResources.get('S3Bucket')!,
        OtherResource: { Type: 'AWS::Lambda::Function', Properties: {} },
      }),
      parameters: [],
      resourcesToMove: sourceResources,
    };
    const postTarget = makeTemplate({ ExistingResource: { Type: 'AWS::IAM::Role', Properties: {} } });
    const logicalIdMap = new Map([['S3Bucket', 'amplifyStorageBucket12345678']]);

    const { finalSource, finalTarget } = refactorer.testBuildRefactorTemplates(source, postTarget, logicalIdMap);

    // Source: S3Bucket removed, OtherResource stays
    expect(finalSource.Resources.S3Bucket).toBeUndefined();
    expect(finalSource.Resources.OtherResource).toBeDefined();

    // Target: remapped ID, properties preserved
    expect(finalTarget.Resources.amplifyStorageBucket12345678).toBeDefined();
    expect(finalTarget.Resources.amplifyStorageBucket12345678.Properties.BucketName).toBe('my-bucket');
    expect(finalTarget.Resources.ExistingResource).toBeDefined();
  });

  it('remaps DependsOn references (both string and array forms)', () => {
    const resourceWithStringDep: CFNResource = { Type: 'AWS::S3::BucketPolicy', Properties: {}, DependsOn: 'S3Bucket' };
    const resourceWithArrayDep: CFNResource = { Type: 'AWS::IAM::Policy', Properties: {}, DependsOn: ['S3Bucket', 'UnmappedResource'] };
    const bucket: CFNResource = { Type: 'AWS::S3::Bucket', Properties: {} };

    const sourceResources = new Map<string, CFNResource>([
      ['S3Bucket', bucket],
      ['BucketPolicy', resourceWithStringDep],
      ['IamPolicy', resourceWithArrayDep],
    ]);
    const source: ResolvedStack = {
      stackId: 'source-stack',
      originalTemplate: makeTemplate(Object.fromEntries(sourceResources)),
      resolvedTemplate: makeTemplate(Object.fromEntries(sourceResources)),
      parameters: [],
      resourcesToMove: sourceResources,
    };
    const logicalIdMap = new Map([
      ['S3Bucket', 'TargetBucket'],
      ['BucketPolicy', 'TargetBucketPolicy'],
      ['IamPolicy', 'TargetIamPolicy'],
    ]);

    const { finalTarget } = refactorer.testBuildRefactorTemplates(source, makeTemplate({}), logicalIdMap);

    // String DependsOn remapped to array with target ID
    expect(finalTarget.Resources.TargetBucketPolicy.DependsOn).toEqual(['TargetBucket']);

    // Array DependsOn: S3Bucket remapped, UnmappedResource kept as-is (fallback)
    expect(finalTarget.Resources.TargetIamPolicy.DependsOn).toEqual(['TargetBucket', 'UnmappedResource']);
  });

  it('skips source resources with no entry in logicalIdMap', () => {
    const sourceResources = new Map<string, CFNResource>([
      ['MappedBucket', { Type: 'AWS::S3::Bucket', Properties: {} }],
      ['UnmappedTable', { Type: 'AWS::DynamoDB::Table', Properties: {} }],
    ]);
    const source: ResolvedStack = {
      stackId: 'source-stack',
      originalTemplate: makeTemplate(Object.fromEntries(sourceResources)),
      resolvedTemplate: makeTemplate(Object.fromEntries(sourceResources)),
      parameters: [],
      resourcesToMove: sourceResources,
    };
    const logicalIdMap = new Map([['MappedBucket', 'TargetBucket']]);
    // UnmappedTable has no entry in logicalIdMap

    const { finalSource, finalTarget } = refactorer.testBuildRefactorTemplates(source, makeTemplate({}), logicalIdMap);

    // Both removed from source (they're in resourcesToMove)
    expect(finalSource.Resources.MappedBucket).toBeUndefined();
    expect(finalSource.Resources.UnmappedTable).toBeUndefined();

    // Only MappedBucket added to target — UnmappedTable skipped
    expect(finalTarget.Resources.TargetBucket).toBeDefined();
    expect(finalTarget.Resources.UnmappedTable).toBeUndefined();
  });
});

describe('addPlaceholderIfNeeded', () => {
  const refactorer = new TestRefactorer();

  it('adds placeholder when all resolved resources are being moved', () => {
    const template = makeTemplate({
      OnlyBucket: { Type: 'AWS::S3::Bucket', Properties: {} },
    });
    const resourcesToMove = new Map<string, CFNResource>([['OnlyBucket', { Type: 'AWS::S3::Bucket', Properties: {} }]]);

    refactorer.testAddPlaceholderIfNeeded(template, resourcesToMove);
    expect(template.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID]).toBeDefined();
  });

  it('does not add placeholder when resolved template has more resources than being moved', () => {
    const template = makeTemplate({
      Bucket: { Type: 'AWS::S3::Bucket', Properties: {} },
      Lambda: { Type: 'AWS::Lambda::Function', Properties: {} },
    });
    const resourcesToMove = new Map<string, CFNResource>([['Bucket', { Type: 'AWS::S3::Bucket', Properties: {} }]]);

    refactorer.testAddPlaceholderIfNeeded(template, resourcesToMove);
    expect(template.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID]).toBeUndefined();
  });
});
