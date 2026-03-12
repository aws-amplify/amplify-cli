import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudFormationClient, GetTemplateCommand, DescribeStackResourcesCommand } from '@aws-sdk/client-cloudformation';

describe('StackFacade', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  let facade: StackFacade;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    facade = new StackFacade(clients, 'root-stack');
  });

  afterEach(() => cfnMock.restore());

  it('returns cached template on second call without hitting AWS', async () => {
    cfnMock.on(GetTemplateCommand).resolves({
      TemplateBody: JSON.stringify({ AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Resources: {}, Outputs: {} }),
    });

    const first = await facade.fetchTemplate('stack-1');
    const second = await facade.fetchTemplate('stack-1');

    expect(first).toBe(second);
    expect(cfnMock.commandCalls(GetTemplateCommand)).toHaveLength(1);
  });

  it('evicts cache entry on rejection and retries on next call', async () => {
    cfnMock
      .on(GetTemplateCommand)
      .rejectsOnce(new Error('throttle'))
      .resolves({
        TemplateBody: JSON.stringify({ AWSTemplateFormatVersion: '2010-09-09', Description: 'ok', Resources: {}, Outputs: {} }),
      });

    await expect(facade.fetchTemplate('stack-1')).rejects.toThrow('throttle');

    const result = await facade.fetchTemplate('stack-1');
    expect(result.Description).toBe('ok');
    expect(cfnMock.commandCalls(GetTemplateCommand)).toHaveLength(2);
  });

  it('fetchNestedStacks filters to AWS::CloudFormation::Stack resources only', async () => {
    cfnMock.on(DescribeStackResourcesCommand).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'arn:auth',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
        {
          LogicalResourceId: 'MyBucket',
          ResourceType: 'AWS::S3::Bucket',
          PhysicalResourceId: 'bucket-123',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
        {
          LogicalResourceId: 'storageStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'arn:storage',
          Timestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
    });

    const stacks = await facade.fetchNestedStacks();
    expect(stacks).toHaveLength(2);
    expect(stacks.map((s) => s.LogicalResourceId)).toEqual(['authStack', 'storageStack']);
  });
});
