import { discoverGen1AuthStacks } from '../../../../commands/gen2-migration/refactor/auth/auth-utils';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { AwsClients } from '../../../../commands/gen2-migration/refactor/aws-clients';
import { mockClient } from 'aws-sdk-client-mock';
import { CloudFormationClient, DescribeStacksCommand, DescribeStackResourcesCommand, ResourceStatus } from '@aws-sdk/client-cloudformation';

const ts = new Date();
const rs = ResourceStatus.CREATE_COMPLETE;

describe('discoverGen1AuthStacks', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('discovers main auth and user pool group stacks from Description JSON', async () => {
    cfnMock.on(DescribeStackResourcesCommand).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authMain',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'auth-main-id',
          Timestamp: ts,
          ResourceStatus: rs,
        },
        {
          LogicalResourceId: 'authUpg',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'auth-upg-id',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'auth-main-id' }).resolves({
      Stacks: [
        {
          StackName: 'auth-main',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: ts,
          Description: JSON.stringify({ stackType: 'auth-Cognito' }),
        },
      ],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'auth-upg-id' }).resolves({
      Stacks: [
        {
          StackName: 'auth-upg',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: ts,
          Description: JSON.stringify({ stackType: 'auth-Cognito-UserPool-Groups' }),
        },
      ],
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cfn = new CloudFormationClient({});
    const facade = new StackFacade(clients, 'root');
    const result = await discoverGen1AuthStacks(facade);

    expect(result.mainAuthStackId).toBe('auth-main-id');
    expect(result.userPoolGroupStackId).toBe('auth-upg-id');
  });

  it('handles invalid JSON in stack Description gracefully', async () => {
    cfnMock.on(DescribeStackResourcesCommand).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authBad',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'auth-bad-id',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'auth-bad-id' }).resolves({
      Stacks: [{ StackName: 'auth-bad', StackStatus: 'CREATE_COMPLETE', CreationTime: ts, Description: 'not-json' }],
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cfn = new CloudFormationClient({});
    const facade = new StackFacade(clients, 'root');
    const result = await discoverGen1AuthStacks(facade);

    expect(result.mainAuthStackId).toBeUndefined();
    expect(result.userPoolGroupStackId).toBeUndefined();
  });

  it('ignores stacks with unknown stackType', async () => {
    cfnMock.on(DescribeStackResourcesCommand).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authUnknown',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'auth-unknown-id',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'auth-unknown-id' }).resolves({
      Stacks: [
        {
          StackName: 'auth-unknown',
          StackStatus: 'CREATE_COMPLETE',
          CreationTime: ts,
          Description: JSON.stringify({ stackType: 'auth-SomeOtherType' }),
        },
      ],
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cfn = new CloudFormationClient({});
    const facade = new StackFacade(clients, 'root');
    const result = await discoverGen1AuthStacks(facade);

    expect(result.mainAuthStackId).toBeUndefined();
    expect(result.userPoolGroupStackId).toBeUndefined();
  });
});
