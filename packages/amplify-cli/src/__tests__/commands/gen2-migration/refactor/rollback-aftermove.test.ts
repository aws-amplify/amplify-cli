import { RollbackCategoryRefactorer } from '../../../../commands/gen2-migration/refactor/workflow/rollback-category-refactorer';
import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import { ResolvedStack } from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
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
 * afterMovePlan reads the holding stack template during plan() and returns
 * 3 separate operations: (1) update holding stack with placeholder,
 * (2) refactor resources back to Gen2, (3) delete holding stack.
 */
describe('RollbackCategoryRefactorer.afterMovePlan', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });

  afterEach(() => {
    cfnMock.restore();
  });

  it('reads holding stack during plan and splits into 3 operations', async () => {
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
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new TestRollbackRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123456789');

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

    // afterMovePlan is now async — reads holding stack template during plan()
    const { operations } = await (refactorer as any).afterMovePlan({
      source: dummyResolved,
      target: dummyResolved,
      finalSource,
      finalTarget: finalSource,
    });

    // 3 operations: update holding with placeholder, refactor back, delete holding
    expect(operations).toHaveLength(3);

    // Verify descriptions
    expect(await operations[0].describe()).toEqual([expect.stringContaining('placeholder')]);
    expect(await operations[1].describe()).toEqual([expect.stringContaining('Restore')]);
    expect(await operations[2].describe()).toEqual([expect.stringContaining('Delete')]);

    // Execute all 3 operations
    await operations[0].execute();
    await operations[1].execute();
    await operations[2].execute();

    // Verify the restore template passed to CreateStackRefactor (op 2)
    const refactorCalls = cfnMock.commandCalls(CreateStackRefactorCommand);
    expect(refactorCalls.length).toBeGreaterThan(0);

    const destTemplate = JSON.parse(refactorCalls[0].args[0].input.StackDefinitions![1].TemplateBody!);

    // Restore template = finalSource + holding stack resources
    expect(destTemplate.Resources.OtherResource).toBeDefined();
    expect(destTemplate.Resources.MyBucket).toBeDefined();
    expect(destTemplate.Resources.MyBucket.Properties.BucketName).toBe('test-bucket');

    // Verify delete was called (op 3)
    expect(cfnMock.commandCalls(DeleteStackCommand).length).toBeGreaterThan(0);
  });

  it('returns empty operations when no holding stack exists', async () => {
    // findHoldingStack returns null when no matching stack exists
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new TestRollbackRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123456789');

    const dummyTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'test',
      Resources: {},
      Outputs: {},
    };
    const dummyResolved: ResolvedStack = {
      stackId: 'gen2-stack-id',
      originalTemplate: dummyTemplate,
      resolvedTemplate: dummyTemplate,
      parameters: [],
      resourcesToMove: new Map(),
    };

    const { operations } = await (refactorer as any).afterMovePlan({
      source: dummyResolved,
      target: dummyResolved,
      finalSource: dummyTemplate,
      finalTarget: dummyTemplate,
    });

    expect(operations).toHaveLength(0);
  });
});
