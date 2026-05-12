import { RollbackCategoryRefactorer } from '../../../../../commands/gen2-migration/refactor/workflow/rollback-category-refactorer';
import { CFNResource, CFNTemplate } from '../../../../../commands/gen2-migration/_common/cfn-template';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';
import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { StackFacade } from '../../../../../commands/gen2-migration/refactor/stack-facade';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';
import { noOpLogger } from '../../_framework/logger';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  GetTemplateCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  UpdateStackCommand,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  ExecuteStackRefactorCommand,
  StackRefactorStatus,
  StackRefactorExecutionStatus,
  ResourceMapping,
} from '@aws-sdk/client-cloudformation';

class TestRollbackRefactorer extends RollbackCategoryRefactorer {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected targetLogicalId(_sourceId: string, _sourceResource: CFNResource): string | undefined {
    return 'S3Bucket';
  }
  protected async fetchSourceStackId() {
    return 'gen2-stack-id';
  }
  protected async fetchDestStackId() {
    return 'gen1-stack-id';
  }
  protected resourceTypes() {
    return ['AWS::S3::Bucket'];
  }
}

describe('RollbackCategoryRefactorer.afterMove', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns operations to update holding stack and move resources back', async () => {
    const gen2Template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2',
      Resources: {
        MigrationPlaceholder: { Type: 'AWS::CloudFormation::WaitConditionHandle', Properties: {} },
      },
      Outputs: {},
    };

    const holdingTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'holding',
      Resources: {
        MyBucket: { Type: 'AWS::S3::Bucket', Properties: { BucketName: 'test-bucket' } },
      },
      Outputs: {},
    };

    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'holding', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }],
    });
    cfnMock.on(GetTemplateCommand).callsFake((input) => {
      const stackName = input.StackName ?? '';
      if (stackName.includes('holding')) {
        return { TemplateBody: JSON.stringify(holdingTemplate) };
      }
      return { TemplateBody: JSON.stringify(gen2Template) };
    });
    cfnMock.on(UpdateStackCommand).resolves({});
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'refactor-123' });
    cfnMock.on(DescribeStackRefactorCommand).resolves({
      Status: StackRefactorStatus.CREATE_COMPLETE,
      ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE,
    });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock.on(DescribeStackResourcesCommand).resolves({ StackResources: [] });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      { region: 'us-east-1', clients } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' },
      cfn,
    );

    const operations = await (refactorer as any).afterMove('gen2-auth-stack-id');

    // 1 operation: move resources from holding stack back to Gen2
    expect(operations).toHaveLength(1);
    expect(await operations[0].describe()).toEqual([expect.stringContaining('Move')]);
  });

  it('returns empty operations when no holding stack exists', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      { region: 'us-east-1', clients } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' },
      cfn,
    );

    const operations = await (refactorer as any).afterMove('gen2-auth-stack-id');
    expect(operations).toHaveLength(0);
  });

  it('throws StackStateError when holding stack is in unexpected state', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'holding', StackStatus: 'ROLLBACK_COMPLETE', CreationTime: new Date() }],
    });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      { region: 'us-east-1', clients } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' },
      cfn,
    );

    await expect((refactorer as any).afterMove('gen2-auth-stack-id')).rejects.toMatchObject({
      name: 'StackStateError',
      message: expect.stringContaining('ROLLBACK_COMPLETE'),
    });
  });
});

class TestRollbackMappingRefactorer extends RollbackCategoryRefactorer {
  private readonly ids: ReadonlyMap<string, string>;

  constructor(ids: ReadonlyMap<string, string>) {
    super(
      null as any,
      null as any,
      { region: 'us-east-1' } as unknown as Gen1App,
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

describe('RollbackCategoryRefactorer.buildResourceMappings (gen1LogicalIds-based)', () => {
  it('maps source resources to Gen1 logical IDs', async () => {
    const refactorer = new TestRollbackMappingRefactorer(
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
    const refactorer = new TestRollbackMappingRefactorer(new Map());
    await expect(refactorer.testBuildResourceMappings(new Map([['amplifyTopic', r('AWS::SNS::Topic')]]), new Map())).rejects.toThrow(
      'Unable to determine target id of resource amplifyTopic',
    );
  });

  it('skips resources that already exist in target stack', async () => {
    const refactorer = new TestRollbackMappingRefactorer(new Map([['amplifyBucket', 'S3Bucket']]));
    const mappings = await refactorer.testBuildResourceMappings(
      new Map([['amplifyBucket', r('AWS::S3::Bucket')]]),
      new Map([['S3Bucket', r('AWS::S3::Bucket')]]),
    );
    expect(mappings).toHaveLength(0);
  });

  it('returns empty mappings when source is empty', async () => {
    const refactorer = new TestRollbackMappingRefactorer(new Map());
    const mappings = await refactorer.testBuildResourceMappings(new Map(), new Map());
    expect(mappings).toHaveLength(0);
  });
});
