import { ForwardCategoryRefactorer } from '../../../../commands/gen2-migration/refactor-new/workflow/forward-category-refactorer';
import { RollbackCategoryRefactorer } from '../../../../commands/gen2-migration/refactor-new/workflow/rollback-category-refactorer';
import { CFNResource } from '../../../../commands/gen2-migration/refactor-new/cfn-template';

class TestForwardRefactorer extends ForwardCategoryRefactorer {
  protected async fetchSourceStackId() {
    return 'gen1-stack';
  }
  protected async fetchDestStackId() {
    return 'gen2-stack';
  }
  protected resourceTypes() {
    return ['AWS::S3::Bucket'];
  }
  public testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>) {
    return this.buildResourceMappings(source, target);
  }
}

class TestRollbackRefactorer extends RollbackCategoryRefactorer {
  protected override readonly gen1LogicalIds: ReadonlyMap<string, string>;

  constructor(ids: ReadonlyMap<string, string>) {
    super(null as any, null as any, null as any, 'us-east-1', '123');
    this.gen1LogicalIds = ids;
  }
  protected async fetchSourceStackId() {
    return 'gen2-stack';
  }
  protected async fetchDestStackId() {
    return 'gen1-stack';
  }
  protected resourceTypes() {
    return [];
  }
  public testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>) {
    return this.buildResourceMappings(source, target);
  }
}

const r = (type: string): CFNResource => ({ Type: type, Properties: {} });

describe('ForwardCategoryRefactorer.buildResourceMappings (default type-matching)', () => {
  const refactorer = new TestForwardRefactorer(null as any, null as any, null as any, 'us-east-1', '123');

  it('maps single resource per type', () => {
    const mapping = refactorer.testBuildResourceMappings(
      new Map([['S3Bucket', r('AWS::S3::Bucket')]]),
      new Map([['amplifyBucket', r('AWS::S3::Bucket')]]),
    );
    expect(mapping.size).toBe(1);
    expect(mapping.get('S3Bucket')).toBe('amplifyBucket');
  });

  it('maps multiple types independently', () => {
    const mapping = refactorer.testBuildResourceMappings(
      new Map([
        ['Bucket', r('AWS::S3::Bucket')],
        ['Table', r('AWS::DynamoDB::Table')],
      ]),
      new Map([
        ['GenBucket', r('AWS::S3::Bucket')],
        ['GenTable', r('AWS::DynamoDB::Table')],
      ]),
    );
    expect(mapping.size).toBe(2);
    expect(mapping.get('Bucket')).toBe('GenBucket');
    expect(mapping.get('Table')).toBe('GenTable');
  });

  // When more source resources of a type exist than target resources, extras are unmapped.
  // Downstream in buildRefactorTemplates, unmapped resources are deleted from the source
  // template (resourcesToMove loop) but never added to the target — they vanish.
  it('drops excess source resources when target has fewer of the same type', () => {
    const mapping = refactorer.testBuildResourceMappings(
      new Map([
        ['BucketA', r('AWS::S3::Bucket')],
        ['BucketB', r('AWS::S3::Bucket')],
      ]),
      new Map([['GenBucket', r('AWS::S3::Bucket')]]),
    );
    expect(mapping.size).toBe(1);
    expect(mapping.get('BucketA')).toBe('GenBucket');
    expect(mapping.has('BucketB')).toBe(false);
  });

  it('returns empty mapping when no types match', () => {
    const mapping = refactorer.testBuildResourceMappings(
      new Map([['Stream', r('AWS::Kinesis::Stream')]]),
      new Map([['Bucket', r('AWS::S3::Bucket')]]),
    );
    expect(mapping.size).toBe(0);
  });
});

describe('RollbackCategoryRefactorer.buildResourceMappings (gen1LogicalIds-based)', () => {
  it('maps source resources to Gen1 logical IDs by type', () => {
    const refactorer = new TestRollbackRefactorer(
      new Map([
        ['AWS::S3::Bucket', 'S3Bucket'],
        ['AWS::DynamoDB::Table', 'DynamoDBTable'],
      ]),
    );
    const mapping = refactorer.testBuildResourceMappings(
      new Map([
        ['amplifyBucket', r('AWS::S3::Bucket')],
        ['amplifyTable', r('AWS::DynamoDB::Table')],
      ]),
      new Map(),
    );
    expect(mapping.size).toBe(2);
    expect(mapping.get('amplifyBucket')).toBe('S3Bucket');
    expect(mapping.get('amplifyTable')).toBe('DynamoDBTable');
  });

  it('throws for resource type not in gen1LogicalIds', () => {
    const refactorer = new TestRollbackRefactorer(new Map([['AWS::S3::Bucket', 'S3Bucket']]));
    expect(() => refactorer.testBuildResourceMappings(new Map([['amplifyTopic', r('AWS::SNS::Topic')]]), new Map())).toThrow(
      "No known Gen1 logical ID for resource type 'AWS::SNS::Topic' (source: 'amplifyTopic')",
    );
  });
});
