import { ForwardCategoryRefactorer } from '../../../../commands/gen2-migration/refactor/workflow/forward-category-refactorer';
import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import { RefactorBlueprint, MoveMapping } from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
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

function makeBlueprint(overrides: {
  targetResolved?: Record<string, CFNResource>;
  targetAfterRemoval?: Record<string, CFNResource>;
  mappings?: MoveMapping[];
}): RefactorBlueprint {
  const sourceTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'source',
    Resources: {},
    Outputs: {},
  };
  const targetResources = overrides.targetResolved ?? {};
  const targetTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'target',
    Resources: targetResources,
    Outputs: {},
  };
  const afterRemovalResources = overrides.targetAfterRemoval ?? {};
  const afterRemoval: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'target after removal',
    Resources: afterRemovalResources,
    Outputs: {},
  };

  return {
    source: {
      stackId: 'gen1-stack',
      parameters: [],
      resolvedTemplate: sourceTemplate,
      afterRemoval: sourceTemplate,
    },
    target: {
      stackId: 'gen2-stack',
      parameters: [],
      resolvedTemplate: targetTemplate,
      afterRemoval,
      afterAddition: afterRemoval,
    },
    mappings: overrides.mappings ?? [],
  };
}

describe('ForwardCategoryRefactorer.beforeMovePlan', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns empty operations when target has no category resources', () => {
    const clients = new AwsClients({ region: 'us-east-1' });
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
    );
    const blueprint = makeBlueprint({
      targetResolved: { Lambda: { Type: 'AWS::Lambda::Function', Properties: {} } },
    });

    const operations = (refactorer as any).beforeMovePlan(blueprint);
    expect(operations).toHaveLength(0);
  });

  it('creates holding stack operation when target has category resources', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
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

    const blueprint = makeBlueprint({
      targetResolved: {
        MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} },
        Other: { Type: 'AWS::Lambda::Function', Properties: {} },
      },
      targetAfterRemoval: {
        Other: { Type: 'AWS::Lambda::Function', Properties: {} },
      },
    });

    const operations = (refactorer as any).beforeMovePlan(blueprint);
    expect(operations).toHaveLength(1);
    expect(await operations[0].describe()).toEqual([expect.stringContaining('holding stack')]);
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

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const refactorer = new TestForwardRefactorer(
      new StackFacade(clients, 'g1'),
      new StackFacade(clients, 'g2'),
      clients,
      'us-east-1',
      '123',
    );

    const blueprint = makeBlueprint({
      targetResolved: { MyBucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
      targetAfterRemoval: {},
    });

    const operations = (refactorer as any).beforeMovePlan(blueprint);
    await operations[0].execute();

    expect(cfnMock.commandCalls(DeleteStackCommand).length).toBeGreaterThan(0);
  });
});
