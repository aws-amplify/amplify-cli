import { RollbackCategoryRefactorer } from '../../../../commands/gen2-migration/refactor-new/workflow/rollback-category-refactorer';
import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/refactor-new/cfn-template';
import { ResolvedStack } from '../../../../commands/gen2-migration/refactor-new/workflow/category-refactorer';
import { AwsClients } from '../../../../commands/gen2-migration/refactor-new/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor-new/stack-facade';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  GetTemplateCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  DeleteStackCommand,
  UpdateStackCommand,
  CreateStackRefactorCommand,
  DescribeStackRefactorCommand,
  ExecuteStackRefactorCommand,
  StackRefactorStatus,
  StackRefactorExecutionStatus,
} from '@aws-sdk/client-cloudformation';

// Concrete test subclass
class TestRollbackRefactorer extends RollbackCategoryRefactorer {
  protected async fetchSourceStackId() {
    return 'gen2-stack-id';
  }
  protected async fetchDestStackId() {
    return 'gen1-stack-id';
  }
  protected resourceTypes() {
    return ['AWS::S3::Bucket'];
  }
  protected buildResourceMappings(source: Map<string, CFNResource>) {
    const mapping = new Map<string, string>();
    for (const [id] of source) mapping.set(id, 'S3Bucket');
    return mapping;
  }
}

/**
 * The rollback afterMovePlan reads the holding stack template during execute(),
 * NOT during plan(). This is the one place where the "all reads in plan, all
 * mutations in execute" contract is violated.
 *
 * Reason: the holding stack's contents depend on what the forward refactor moved
 * into it, which may vary between plan() and execute() in retry scenarios.
 */
describe('RollbackCategoryRefactorer.afterMovePlan - holding stack read', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });

  afterEach(() => {
    cfnMock.restore();
  });

  it('reads holding stack template during execute and builds correct restore template', async () => {
    const holdingTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'holding',
      Resources: {
        MyBucket: { Type: 'AWS::S3::Bucket', Properties: { BucketName: 'test-bucket' } },
      },
      Outputs: {},
    };

    // DescribeStacks: first call for findHoldingStack, subsequent for pollStackForCompletionState
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'holding', StackStatus: 'UPDATE_COMPLETE', CreationTime: new Date() }],
    });

    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: JSON.stringify(holdingTemplate) });
    cfnMock.on(UpdateStackCommand).resolves({});
    cfnMock.on(CreateStackRefactorCommand).resolves({ StackRefactorId: 'refactor-123' });
    cfnMock.on(DescribeStackRefactorCommand).resolves({
      Status: StackRefactorStatus.CREATE_COMPLETE,
      ExecutionStatus: StackRefactorExecutionStatus.EXECUTE_COMPLETE,
    });
    cfnMock.on(ExecuteStackRefactorCommand).resolves({});
    cfnMock.on(DeleteStackCommand).resolves({});
    cfnMock.on(DescribeStackResourcesCommand).resolves({ StackResources: [] });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cfn = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new TestRollbackRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123456789');

    // finalSource = Gen2 template after main auth resources were moved out
    const finalSource: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 after move',
      Resources: { OtherResource: { Type: 'AWS::Lambda::Function', Properties: {} } },
      Outputs: {},
    };

    const dummyResolved: ResolvedStack = {
      stackId: 'gen2-auth-stack-id',
      originalTemplate: finalSource,
      resolvedTemplate: finalSource,
      parameters: [],
      resourcesToMove: new Map(),
    };

    const { operations } = (refactorer as any).afterMovePlan({
      source: dummyResolved,
      target: dummyResolved,
      finalSource,
      finalTarget: finalSource,
    });

    expect(operations).toHaveLength(1);
    await operations[0].execute();

    // Verify the restore template passed to CreateStackRefactor
    const refactorCalls = cfnMock.commandCalls(CreateStackRefactorCommand);
    expect(refactorCalls.length).toBeGreaterThan(0);

    const destTemplate = JSON.parse(refactorCalls[0].args[0].input.StackDefinitions![1].TemplateBody!);

    // Restore template = finalSource + holding stack resources
    expect(destTemplate.Resources.OtherResource).toBeDefined();
    expect(destTemplate.Resources.MyBucket).toBeDefined();
    expect(destTemplate.Resources.MyBucket.Properties.BucketName).toBe('test-bucket');
  });
});
