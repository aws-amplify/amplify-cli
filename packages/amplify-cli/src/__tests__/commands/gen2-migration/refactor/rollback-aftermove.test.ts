import { RollbackCategoryRefactorer } from '../../../../commands/gen2-migration/refactor/workflow/rollback-category-refactorer';
import { CFNResource, CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import { RefactorBlueprint } from '../../../../commands/gen2-migration/refactor/workflow/category-refactorer';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { Cfn } from '../../../../commands/gen2-migration/refactor/cfn';
import { noOpLogger } from '../_framework/logger';
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

function makeBlueprint(mappings: ResourceMapping[]): RefactorBlueprint {
  return {
    sourceStackId: 'gen2-auth-stack-id',
    targetStackId: 'gen1-stack-id',
    mappings,
  };
}

describe('RollbackCategoryRefactorer.afterMove', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns operations to update holding stack and move resources back', async () => {
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
    cfnMock.on(DescribeStackResourcesCommand).resolves({ StackResources: [] });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      clients,
      'us-east-1',
      '123456789',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' },
      cfn,
    );

    const blueprint = makeBlueprint([
      {
        Source: { StackName: 'gen2-auth-stack-id', LogicalResourceId: 'MyBucket' },
        Destination: { StackName: 'gen1-stack-id', LogicalResourceId: 'S3Bucket' },
      },
    ]);

    const operations = await (refactorer as any).afterMove(blueprint);

    // 2 operations: update holding with placeholder, refactor back to Gen2
    expect(operations).toHaveLength(2);
    expect(await operations[0].describe()).toEqual([expect.stringContaining('placeholder')]);
    expect(await operations[1].describe()).toEqual([expect.stringContaining('Move')]);
  });

  it('returns empty operations when no holding stack exists', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new TestRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      clients,
      'us-east-1',
      '123456789',
      noOpLogger(),
      { category: 'storage', resourceName: 'test', service: 'S3', key: 'storage:S3' },
      cfn,
    );

    const blueprint = makeBlueprint([]);

    const operations = await (refactorer as any).afterMove(blueprint);
    expect(operations).toHaveLength(0);
  });
});
