import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { AwsClients } from '../../../../commands/gen2-migration/_common/aws-clients';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudFormationClient, GetTemplateCommand, ListStackResourcesCommand } from '@aws-sdk/client-cloudformation';

describe('StackFacade', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  let facade: StackFacade;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    facade = new StackFacade(clients, 'root-stack');
  });

  afterEach(() => cfnMock.restore());

  it('fetches and parses template from CloudFormation', async () => {
    cfnMock.on(GetTemplateCommand).resolves({
      TemplateBody: JSON.stringify({ AWSTemplateFormatVersion: '2010-09-09', Description: 'test', Resources: {}, Outputs: {} }),
    });

    const result = await facade.fetchTemplate('stack-1');
    expect(result.Description).toBe('test');
    expect(cfnMock.commandCalls(GetTemplateCommand)).toHaveLength(1);
  });

  it('throws when template body is empty', async () => {
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: undefined });

    await expect(facade.fetchTemplate('stack-1')).rejects.toThrow('returned an empty template');
  });

  it('fetchNestedStacks filters to AWS::CloudFormation::Stack resources only', async () => {
    cfnMock.on(ListStackResourcesCommand).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'arn:auth',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
        {
          LogicalResourceId: 'MyBucket',
          ResourceType: 'AWS::S3::Bucket',
          PhysicalResourceId: 'bucket-123',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
        {
          LogicalResourceId: 'storageStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'arn:storage',
          LastUpdatedTimestamp: new Date(),
          ResourceStatus: 'CREATE_COMPLETE',
        },
      ],
    });

    const stacks = await facade.fetchNestedStacks();
    expect(stacks).toHaveLength(2);
    expect(stacks.map((s) => s.LogicalResourceId)).toEqual(['authStack', 'storageStack']);
  });
});
