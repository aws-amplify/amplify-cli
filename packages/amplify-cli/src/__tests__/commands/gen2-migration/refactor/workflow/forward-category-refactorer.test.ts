import { ForwardCategoryRefactorer } from '../../../../../commands/gen2-migration/refactor/workflow/forward-category-refactorer';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';
import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { StackFacade } from '../../../../../commands/gen2-migration/refactor/stack-facade';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';
import { noOpLogger } from '../../_framework/logger';
import { mockClient } from 'aws-sdk-client-mock';
import { S3Client } from '@aws-sdk/client-s3';

// Mock S3 globally so uploadTemplate calls succeed
mockClient(S3Client);
import {
  CloudFormationClient,
  DescribeStacksCommand,
  ListStackResourcesCommand,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  ExecuteStackRefactorCommand,
  GetTemplateCommand,
  DeleteStackCommand,
  StackRefactorStatus,
  StackRefactorExecutionStatus,
  ResourceMapping,
} from '@aws-sdk/client-cloudformation';

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
}

const GEN2_TEMPLATE_WITH_BUCKET = JSON.stringify({
  AWSTemplateFormatVersion: '2010-09-09',
  Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
  Outputs: {},
});

const GEN2_TEMPLATE_NO_BUCKET = JSON.stringify({
  AWSTemplateFormatVersion: '2010-09-09',
  Resources: { Lambda: { Type: 'AWS::Lambda::Function', Properties: {} } },
  Outputs: {},
});

describe('ForwardCategoryRefactorer.beforeMove', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns empty operations when gen2 stack has no matching resources', async () => {
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: GEN2_TEMPLATE_NO_BUCKET });
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    const cfn = new Cfn(gen1App, noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );

    const operations = await (refactorer as any).beforeMove({ sourceStackId: 'gen1-stack', targetStackId: 'gen2-stack', mappings: [] });
    expect(operations).toHaveLength(0);
  });

  it('creates holding stack operation when gen2 stack has matching resources', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'r1' });
    cfnMock
      .on(DescribeStackRefactorCommand)
      .resolves({ Status: StackRefactorStatus.CREATE_COMPLETE, ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock.on(ListStackResourcesCommand).resolves({ StackResourceSummaries: [] });
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: GEN2_TEMPLATE_WITH_BUCKET });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    const cfn = new Cfn(gen1App, noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );

    const operations = await (refactorer as any).beforeMove({ sourceStackId: 'gen1-stack', targetStackId: 'gen2-stack', mappings: [] });
    expect(operations).toHaveLength(1);
    expect(await operations[0].describe()).toEqual([expect.stringContaining('holding')]);
  });

  it('cleans up orphaned REVIEW_IN_PROGRESS holding stack before creating new one', async () => {
    cfnMock
      .on(DescribeStacksCommand)
      .resolvesOnce({ Stacks: [{ StackName: 'holding', StackStatus: 'REVIEW_IN_PROGRESS', CreationTime: new Date() }] })
      .resolvesOnce({ Stacks: [{ StackName: 'holding', StackStatus: 'DELETE_COMPLETE', CreationTime: new Date() }] })
      .resolves({ Stacks: [{ StackName: 'stack', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }] });
    cfnMock.on(DeleteStackCommand).resolves({});
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'r1' });
    cfnMock
      .on(DescribeStackRefactorCommand)
      .resolves({ Status: StackRefactorStatus.CREATE_COMPLETE, ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock.on(ListStackResourcesCommand).resolves({ StackResourceSummaries: [] });
    cfnMock.on(GetTemplateCommand).callsFake(async (input: { StackName?: string }) => {
      // REVIEW_IN_PROGRESS holding stack has no resources of interest
      if (input.StackName?.endsWith('-holding')) {
        return { TemplateBody: JSON.stringify({ AWSTemplateFormatVersion: '2010-09-09', Resources: {}, Outputs: {} }) };
      }
      return { TemplateBody: GEN2_TEMPLATE_WITH_BUCKET };
    });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    const cfn = new Cfn(gen1App, noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );

    const operations = await (refactorer as any).beforeMove({ sourceStackId: 'gen1-stack', targetStackId: 'gen2-stack', mappings: [] });
    expect(operations).toHaveLength(2);
    await operations[0].execute();

    expect(cfnMock.commandCalls(DeleteStackCommand).length).toBeGreaterThan(0);
  });

  it('throws StackStateError when holding stack is in unexpected state', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'holding', StackStatus: 'ROLLBACK_COMPLETE', CreationTime: new Date() }],
    });
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: GEN2_TEMPLATE_WITH_BUCKET });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    const cfn = new Cfn(gen1App, noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );

    await expect(
      (refactorer as any).beforeMove({ sourceStackId: 'gen1-stack', targetStackId: 'gen2-stack', mappings: [] }),
    ).rejects.toMatchObject({
      name: 'StackStateError',
      message: expect.stringContaining('ROLLBACK_COMPLETE'),
    });
  });
});

import { CFNResource } from '../../../../../commands/gen2-migration/_common/cfn-template';

class TestForwardMappingRefactorer extends ForwardCategoryRefactorer {
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

const r = (type: string): CFNResource => ({ Type: type, Properties: {} });

function toIdMap(mappings: ResourceMapping[]): Map<string, string> {
  return new Map(mappings.map((m) => [m.Source!.LogicalResourceId!, m.Destination!.LogicalResourceId!]));
}

describe('ForwardCategoryRefactorer.buildResourceMappings (default type-matching)', () => {
  const refactorer = new TestForwardMappingRefactorer(
    null as any,
    null as any,
    { region: 'us-east-1' } as unknown as Gen1App,
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
    ).rejects.toThrow('Unable to map Gen1 resource Stream (AWS::Kinesis::Stream) to Gen2 resource');
  });

  it('throws when source resource has multiple matching target resources', async () => {
    await expect(
      refactorer.testBuildResourceMappings(
        new Map([['S3Bucket', r('AWS::S3::Bucket')]]),
        new Map([
          ['Bucket1', r('AWS::S3::Bucket')],
          ['Bucket2', r('AWS::S3::Bucket')],
        ]),
      ),
    ).rejects.toThrow('Unable to map Gen1 resource S3Bucket (AWS::S3::Bucket) to Gen2 resource');
  });

  it('returns empty mappings when source is empty', async () => {
    const mappings = await refactorer.testBuildResourceMappings(new Map(), new Map([['amplifyBucket', r('AWS::S3::Bucket')]]));
    expect(mappings).toHaveLength(0);
  });

  it('throws when two source resources match the same target', async () => {
    await expect(
      refactorer.testBuildResourceMappings(
        new Map([
          ['BucketA', r('AWS::S3::Bucket')],
          ['BucketB', r('AWS::S3::Bucket')],
        ]),
        new Map([['GenBucket', r('AWS::S3::Bucket')]]),
      ),
    ).rejects.toThrow('Unable to map Gen1 resource');
  });

  it('throws when both sides have multiple resources of the same type', async () => {
    await expect(
      refactorer.testBuildResourceMappings(
        new Map([
          ['BucketA', r('AWS::S3::Bucket')],
          ['BucketB', r('AWS::S3::Bucket')],
        ]),
        new Map([
          ['GenBucket1', r('AWS::S3::Bucket')],
          ['GenBucket2', r('AWS::S3::Bucket')],
        ]),
      ),
    ).rejects.toThrow('Unable to map Gen1 resource');
  });
});
