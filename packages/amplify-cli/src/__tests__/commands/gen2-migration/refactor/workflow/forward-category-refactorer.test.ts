import { ForwardCategoryRefactorer } from '../../../../../commands/gen2-migration/refactor/workflow/forward-category-refactorer';
import { RefactorBlueprint } from '../../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
import { AwsClients } from '../../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../../commands/gen2-migration/refactor/stack-facade';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';
import { noOpLogger } from '../../_framework/logger';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
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

function makeBlueprint(mappings: ResourceMapping[]): RefactorBlueprint {
  return {
    sourceStackId: 'gen1-stack',
    targetStackId: 'gen2-stack',
    mappings,
  };
}

describe('ForwardCategoryRefactorer.beforeMove', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns empty operations when no mappings', async () => {
    const clients = new AwsClients({ region: 'us-east-1' });
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );
    const blueprint = makeBlueprint([]);

    const operations = await (refactorer as any).beforeMove(blueprint);
    expect(operations).toHaveLength(0);
  });

  it('creates holding stack operation when mappings exist', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'r1' });
    cfnMock
      .on(DescribeStackRefactorCommand)
      .resolves({ Status: StackRefactorStatus.CREATE_COMPLETE, ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock.on(DescribeStackResourcesCommand).resolves({ StackResources: [] });
    cfnMock.on(GetTemplateCommand).resolves({
      TemplateBody: JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
        Outputs: {},
      }),
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );

    const blueprint = makeBlueprint([
      {
        Source: { StackName: 'gen1-stack', LogicalResourceId: 'S3Bucket' },
        Destination: { StackName: 'gen2-stack', LogicalResourceId: 'MyBucket' },
      },
    ]);

    const operations = await (refactorer as any).beforeMove(blueprint);
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
    cfnMock.on(DescribeStackResourcesCommand).resolves({ StackResources: [] });
    cfnMock.on(GetTemplateCommand).resolves({
      TemplateBody: JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
        Outputs: {},
      }),
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );

    const blueprint = makeBlueprint([
      {
        Source: { StackName: 'gen1-stack', LogicalResourceId: 'S3Bucket' },
        Destination: { StackName: 'gen2-stack', LogicalResourceId: 'MyBucket' },
      },
    ]);

    const operations = await (refactorer as any).beforeMove(blueprint);
    expect(operations).toHaveLength(2);
    await operations[0].execute();

    expect(cfnMock.commandCalls(DeleteStackCommand).length).toBeGreaterThan(0);
  });
});

import { CFNResource } from '../../../../../commands/gen2-migration/cfn-template';

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
