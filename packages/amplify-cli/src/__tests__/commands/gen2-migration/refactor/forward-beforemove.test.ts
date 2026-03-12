import { ForwardCategoryRefactorer } from '../../../../commands/gen2-migration/refactor/workflow/forward-category-refactorer';
import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import { ResolvedStack } from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  ExecuteStackRefactorCommand,
  DeleteStackCommand,
  StackRefactorStatus,
  StackRefactorExecutionStatus,
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

function makeResolved(stackId: string, resources: Map<string, CFNResource>, template?: CFNTemplate): ResolvedStack {
  const t = template ?? {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'test',
    Resources: Object.fromEntries(resources),
    Outputs: {},
  };
  return { stackId, originalTemplate: t, resolvedTemplate: t, parameters: [], resourcesToMove: resources };
}

describe('ForwardCategoryRefactorer.beforeMovePlan', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns empty operations when target has no resources to move', () => {
    const clients = new AwsClients({ region: 'us-east-1' });
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
    );
    const source = makeResolved('gen1', new Map());
    const target = makeResolved('gen2', new Map());

    const { operations, postTargetTemplate } = (refactorer as any).beforeMovePlan(source, target);
    expect(operations).toHaveLength(0);
    expect(postTargetTemplate).toBe(target.resolvedTemplate);
  });

  it('creates holding stack operation when target has resources to move', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] }); // no orphaned holding stack
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'r1' });
    cfnMock
      .on(DescribeStackRefactorCommand)
      .resolves({ Status: StackRefactorStatus.CREATE_COMPLETE, ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock.on(DescribeStackResourcesCommand).resolves({ StackResources: [] });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
    );

    const targetResources = new Map<string, CFNResource>([['MyBucket', { Type: 'AWS::S3::Bucket', Properties: {} }]]);
    const targetTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} }, Other: { Type: 'AWS::Lambda::Function', Properties: {} } },
      Outputs: {},
    };
    const target = makeResolved('gen2-stack', targetResources, targetTemplate);
    const source = makeResolved('gen1-stack', new Map());

    const { operations, postTargetTemplate } = (refactorer as any).beforeMovePlan(source, target);
    expect(operations).toHaveLength(1);
    expect(await operations[0].describe()).toEqual([expect.stringContaining('holding stack')]);

    // postTargetTemplate should have MyBucket removed
    expect(postTargetTemplate.Resources.MyBucket).toBeUndefined();
    expect(postTargetTemplate.Resources.Other).toBeDefined();
  });

  it('cleans up orphaned REVIEW_IN_PROGRESS holding stack before creating new one', async () => {
    // findHoldingStack sees REVIEW_IN_PROGRESS, then delete poll sees DELETE_COMPLETE,
    // then post-refactor polls see UPDATE_COMPLETE for both stacks
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

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
    );

    const targetResources = new Map<string, CFNResource>([['MyBucket', { Type: 'AWS::S3::Bucket', Properties: {} }]]);
    const targetTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
      Outputs: {},
    };
    const target = makeResolved('gen2-stack', targetResources, targetTemplate);
    const source = makeResolved('gen1-stack', new Map());

    const { operations } = (refactorer as any).beforeMovePlan(source, target);
    await operations[0].execute();

    // Verify DeleteStack was called (orphaned cleanup)
    expect(cfnMock.commandCalls(DeleteStackCommand).length).toBeGreaterThan(0);
  });
});
