import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import {
  CategoryRefactorer,
  RefactorBlueprint,
  ResolvedStack,
  MoveMapping,
  MIGRATION_PLACEHOLDER_LOGICAL_ID,
} from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';

// Minimal concrete subclass to access protected methods
class TestRefactorer extends (CategoryRefactorer as any) {
  private mappingsToReturn: MoveMapping[] = [];

  constructor() {
    super(null, null, null, 'us-east-1', '123', null as any);
  }

  setMappings(mappings: MoveMapping[]) {
    this.mappingsToReturn = mappings;
  }

  public testBuildBlueprint(source: ResolvedStack, target: ResolvedStack): RefactorBlueprint | undefined {
    return (this as any).buildBlueprint(source, target);
  }

  protected async fetchSourceStackId() {
    return undefined;
  }
  protected async fetchDestStackId() {
    return undefined;
  }
  protected resourceTypes() {
    return ['AWS::S3::Bucket', 'AWS::DynamoDB::Table', 'AWS::S3::BucketPolicy', 'AWS::IAM::Policy'];
  }
  protected buildResourceMappings() {
    return this.mappingsToReturn;
  }
  protected resolveSource() {
    return Promise.resolve({} as any);
  }
  protected resolveTarget() {
    return Promise.resolve({} as any);
  }
  protected beforeMovePlan() {
    return [];
  }
  protected async afterMovePlan() {
    return [];
  }
}

const makeTemplate = (resources: Record<string, CFNResource>): CFNTemplate => ({
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'test',
  Resources: resources,
  Outputs: {},
});

describe('buildBlueprint', () => {
  const refactorer = new TestRefactorer();

  it('returns undefined when source has no matching resources', () => {
    const source: ResolvedStack = {
      stackId: 'source-stack',
      resolvedTemplate: makeTemplate({
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} },
      }),
      parameters: [],
    };
    const target: ResolvedStack = {
      stackId: 'target-stack',
      resolvedTemplate: makeTemplate({}),
      parameters: [],
    };
    refactorer.setMappings([]);
    expect(refactorer.testBuildBlueprint(source, target)).toBeUndefined();
  });

  it('removes resources from source and adds them to target with remapped IDs', () => {
    const bucket: CFNResource = { Type: 'AWS::S3::Bucket', Properties: { BucketName: 'my-bucket' } };
    const source: ResolvedStack = {
      stackId: 'source-stack',
      resolvedTemplate: makeTemplate({
        S3Bucket: bucket,
        OtherResource: { Type: 'AWS::Lambda::Function', Properties: {} },
      }),
      parameters: [],
    };
    const target: ResolvedStack = {
      stackId: 'target-stack',
      resolvedTemplate: makeTemplate({
        amplifyStorageBucket12345678: { Type: 'AWS::S3::Bucket', Properties: {} },
      }),
      parameters: [],
    };
    refactorer.setMappings([{ sourceId: 'S3Bucket', targetId: 'amplifyStorageBucket12345678', resource: bucket }]);

    const blueprint = refactorer.testBuildBlueprint(source, target)!;

    // Source afterRemoval: S3Bucket removed, OtherResource stays
    expect(blueprint.source.afterRemoval.Resources.S3Bucket).toBeUndefined();
    expect(blueprint.source.afterRemoval.Resources.OtherResource).toBeDefined();

    // Target afterAddition: remapped ID, properties preserved
    expect(blueprint.target.afterAddition.Resources.amplifyStorageBucket12345678).toBeDefined();
    expect(blueprint.target.afterAddition.Resources.amplifyStorageBucket12345678.Properties.BucketName).toBe('my-bucket');
  });

  it('remaps DependsOn references (both string and array forms)', () => {
    const bucket: CFNResource = { Type: 'AWS::S3::Bucket', Properties: {} };
    const bucketPolicy: CFNResource = { Type: 'AWS::S3::BucketPolicy', Properties: {}, DependsOn: 'S3Bucket' };
    const iamPolicy: CFNResource = { Type: 'AWS::IAM::Policy', Properties: {}, DependsOn: ['S3Bucket', 'UnmappedResource'] };

    const source: ResolvedStack = {
      stackId: 'source-stack',
      resolvedTemplate: makeTemplate({ S3Bucket: bucket, BucketPolicy: bucketPolicy, IamPolicy: iamPolicy }),
      parameters: [],
    };
    const target: ResolvedStack = {
      stackId: 'target-stack',
      resolvedTemplate: makeTemplate({
        TargetBucket: { Type: 'AWS::S3::Bucket', Properties: {} },
        TargetBucketPolicy: { Type: 'AWS::S3::BucketPolicy', Properties: {} },
        TargetIamPolicy: { Type: 'AWS::IAM::Policy', Properties: {} },
      }),
      parameters: [],
    };
    refactorer.setMappings([
      { sourceId: 'S3Bucket', targetId: 'TargetBucket', resource: bucket },
      { sourceId: 'BucketPolicy', targetId: 'TargetBucketPolicy', resource: bucketPolicy },
      { sourceId: 'IamPolicy', targetId: 'TargetIamPolicy', resource: iamPolicy },
    ]);

    const blueprint = refactorer.testBuildBlueprint(source, target)!;

    // String DependsOn remapped to array with target ID
    expect(blueprint.target.afterAddition.Resources.TargetBucketPolicy.DependsOn).toEqual(['TargetBucket']);

    // Array DependsOn: S3Bucket remapped, UnmappedResource kept as-is (fallback)
    expect(blueprint.target.afterAddition.Resources.TargetIamPolicy.DependsOn).toEqual(['TargetBucket', 'UnmappedResource']);
  });

  it('adds placeholder to source.afterRemoval when all source resources are mapped', () => {
    const bucket: CFNResource = { Type: 'AWS::S3::Bucket', Properties: {} };
    const source: ResolvedStack = {
      stackId: 'source-stack',
      resolvedTemplate: makeTemplate({ OnlyBucket: bucket }),
      parameters: [],
    };
    const target: ResolvedStack = {
      stackId: 'target-stack',
      resolvedTemplate: makeTemplate({ TargetBucket: { Type: 'AWS::S3::Bucket', Properties: {} } }),
      parameters: [],
    };
    refactorer.setMappings([{ sourceId: 'OnlyBucket', targetId: 'TargetBucket', resource: bucket }]);

    const blueprint = refactorer.testBuildBlueprint(source, target)!;
    expect(blueprint.source.afterRemoval.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID]).toBeDefined();
  });

  it('adds placeholder to target.afterRemoval when all target category resources are removed', () => {
    const bucket: CFNResource = { Type: 'AWS::S3::Bucket', Properties: {} };
    const source: ResolvedStack = {
      stackId: 'source-stack',
      resolvedTemplate: makeTemplate({
        SourceBucket: bucket,
        Lambda: { Type: 'AWS::Lambda::Function', Properties: {} },
      }),
      parameters: [],
    };
    const target: ResolvedStack = {
      stackId: 'target-stack',
      resolvedTemplate: makeTemplate({ TargetBucket: { Type: 'AWS::S3::Bucket', Properties: {} } }),
      parameters: [],
    };
    refactorer.setMappings([{ sourceId: 'SourceBucket', targetId: 'TargetBucket', resource: bucket }]);

    const blueprint = refactorer.testBuildBlueprint(source, target)!;
    expect(blueprint.target.afterRemoval.Resources[MIGRATION_PLACEHOLDER_LOGICAL_ID]).toBeDefined();
    expect(blueprint.target.afterRemoval.Resources.TargetBucket).toBeUndefined();
  });
});
