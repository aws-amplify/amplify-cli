import { ForwardCategoryRefactorer } from '../../../../commands/gen2-migration/refactor-new/workflow/forward-category-refactorer';
import { RollbackCategoryRefactorer } from '../../../../commands/gen2-migration/refactor-new/workflow/rollback-category-refactorer';
import { CFNResource } from '../../../../commands/gen2-migration/cfn-template';
import { MoveMapping } from '../../../../commands/gen2-migration/refactor-new/workflow/category-refactorer';

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
  public testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>): MoveMapping[] {
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
  public testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>): MoveMapping[] {
    return this.buildResourceMappings(source, target);
  }
}

const r = (type: string): CFNResource => ({ Type: type, Properties: {} });

/** Helper: convert MoveMapping[] to Map<sourceId, targetId> for easy assertions */
function toIdMap(mappings: MoveMapping[]): Map<string, string> {
  return new Map(mappings.map((m) => [m.sourceId, m.targetId]));
}

describe('ForwardCategoryRefactorer.buildResourceMappings (default type-matching)', () => {
  const refactorer = new TestForwardRefactorer(null as any, null as any, null as any, 'us-east-1', '123');

  it('maps single resource per type', () => {
    const mappings = refactorer.testBuildResourceMappings(
      new Map([['S3Bucket', r('AWS::S3::Bucket')]]),
      new Map([['amplifyBucket', r('AWS::S3::Bucket')]]),
    );
    const map = toIdMap(mappings);
    expect(map.size).toBe(1);
    expect(map.get('S3Bucket')).toBe('amplifyBucket');
  });

  it('maps multiple types independently', () => {
    const mappings = refactorer.testBuildResourceMappings(
      new Map([
        ['Bucket', r('AWS::S3::Bucket')],
        ['Table', r('AWS::DynamoDB::Table')],
      ]),
      new Map([
        ['GenBucket', r('AWS::S3::Bucket')],
        ['GenTable', r('AWS::DynamoDB::Table')],
      ]),
    );
    const map = toIdMap(mappings);
    expect(map.size).toBe(2);
    expect(map.get('Bucket')).toBe('GenBucket');
    expect(map.get('Table')).toBe('GenTable');
  });

  it('throws when target has fewer resources of the same type', () => {
    expect(() =>
      refactorer.testBuildResourceMappings(
        new Map([
          ['BucketA', r('AWS::S3::Bucket')],
          ['BucketB', r('AWS::S3::Bucket')],
        ]),
        new Map([['GenBucket', r('AWS::S3::Bucket')]]),
      ),
    ).toThrow("Source resource 'BucketB' (type 'AWS::S3::Bucket') has no corresponding target resource");
  });

  it('throws when no types match', () => {
    expect(() =>
      refactorer.testBuildResourceMappings(new Map([['Stream', r('AWS::Kinesis::Stream')]]), new Map([['Bucket', r('AWS::S3::Bucket')]])),
    ).toThrow("Source resource 'Stream' (type 'AWS::Kinesis::Stream') has no corresponding target resource");
  });

  it('includes resource in MoveMapping', () => {
    const bucket = r('AWS::S3::Bucket');
    const mappings = refactorer.testBuildResourceMappings(
      new Map([['S3Bucket', bucket]]),
      new Map([['amplifyBucket', r('AWS::S3::Bucket')]]),
    );
    expect(mappings[0].resource).toBe(bucket);
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
    const mappings = refactorer.testBuildResourceMappings(
      new Map([
        ['amplifyBucket', r('AWS::S3::Bucket')],
        ['amplifyTable', r('AWS::DynamoDB::Table')],
      ]),
      new Map(),
    );
    const map = toIdMap(mappings);
    expect(map.size).toBe(2);
    expect(map.get('amplifyBucket')).toBe('S3Bucket');
    expect(map.get('amplifyTable')).toBe('DynamoDBTable');
  });

  it('throws for resource type not in gen1LogicalIds', () => {
    const refactorer = new TestRollbackRefactorer(new Map([['AWS::S3::Bucket', 'S3Bucket']]));
    expect(() => refactorer.testBuildResourceMappings(new Map([['amplifyTopic', r('AWS::SNS::Topic')]]), new Map())).toThrow(
      "No known Gen1 logical ID for resource type 'AWS::SNS::Topic' (source: 'amplifyTopic')",
    );
  });
});
