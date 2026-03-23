import { ForwardCategoryRefactorer } from '../../../../commands/gen2-migration/refactor/workflow/forward-category-refactorer';
import { RollbackCategoryRefactorer } from '../../../../commands/gen2-migration/refactor/workflow/rollback-category-refactorer';
import { CFNResource } from '../../../../commands/gen2-migration/cfn-template';
import { ResourceMapping } from '@aws-sdk/client-cloudformation';
import { noOpLogger } from '../_framework/logger';
import { Cfn } from '../../../../commands/gen2-migration/refactor/cfn';

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
  public async testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>): Promise<ResourceMapping[]> {
    return this.buildResourceMappings(source, target, 'gen1-stack', 'gen2-stack');
  }
}

class TestRollbackRefactorer extends RollbackCategoryRefactorer {
  private readonly ids: ReadonlyMap<string, string>;

  constructor(ids: ReadonlyMap<string, string>) {
    super(
      null as any,
      null as any,
      null as any,
      'us-east-1',
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      null as unknown as Cfn,
    );
    this.ids = ids;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected targetLogicalId(sourceId: string, _sourceResource: CFNResource): string | undefined {
    return this.ids.get(sourceId);
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
  public async testBuildResourceMappings(source: Map<string, CFNResource>, target: Map<string, CFNResource>): Promise<ResourceMapping[]> {
    return this.buildResourceMappings(source, target, 'gen2-stack', 'gen1-stack');
  }
}

const r = (type: string): CFNResource => ({ Type: type, Properties: {} });

function toIdMap(mappings: ResourceMapping[]): Map<string, string> {
  return new Map(mappings.map((m) => [m.Source!.LogicalResourceId!, m.Destination!.LogicalResourceId!]));
}

describe('ForwardCategoryRefactorer.buildResourceMappings (default type-matching)', () => {
  const refactorer = new TestForwardRefactorer(
    null as any,
    null as any,
    null as any,
    'us-east-1',
    '123',
    noOpLogger(),
    { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
    null as unknown as Cfn,
  );

  it('maps single resource per type', async () => {
    const mappings = await refactorer.testBuildResourceMappings(
      new Map([['S3Bucket', r('AWS::S3::Bucket')]]),
      new Map([['amplifyBucket', r('AWS::S3::Bucket')]]),
    );
    const map = toIdMap(mappings);
    expect(map.size).toBe(1);
    expect(map.get('S3Bucket')).toBe('amplifyBucket');
  });

  it('maps multiple types independently', async () => {
    const mappings = await refactorer.testBuildResourceMappings(
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

  it('throws when no types match', async () => {
    await expect(
      refactorer.testBuildResourceMappings(new Map([['Stream', r('AWS::Kinesis::Stream')]]), new Map([['Bucket', r('AWS::S3::Bucket')]])),
    ).rejects.toThrow("Source resource 'Stream' (AWS::Kinesis::Stream) has no corresponding target resource");
  });
});

describe('RollbackCategoryRefactorer.buildResourceMappings (gen1LogicalIds-based)', () => {
  it('maps source resources to Gen1 logical IDs', async () => {
    const refactorer = new TestRollbackRefactorer(
      new Map([
        ['amplifyBucket', 'S3Bucket'],
        ['amplifyTable', 'DynamoDBTable'],
      ]),
    );
    const mappings = await refactorer.testBuildResourceMappings(
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

  it('throws for resource with no known Gen1 logical ID', async () => {
    const refactorer = new TestRollbackRefactorer(new Map());
    await expect(refactorer.testBuildResourceMappings(new Map([['amplifyTopic', r('AWS::SNS::Topic')]]), new Map())).rejects.toThrow(
      'Unable to determine target id of resource amplifyTopic',
    );
  });
});
