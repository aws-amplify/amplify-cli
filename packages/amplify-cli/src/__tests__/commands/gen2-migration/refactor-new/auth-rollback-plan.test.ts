import { AuthRollbackRefactorer } from '../../../../commands/gen2-migration/refactor-new/auth/auth-rollback';
import { CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor-new/stack-facade';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  GetTemplateCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  ResourceStatus,
} from '@aws-sdk/client-cloudformation';

const ts = new Date();
const rs = ResourceStatus.CREATE_COMPLETE;

const gen2AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'gen2 auth',
  Resources: {
    amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
    amplifyAuthUserPoolClientWeb12345678: { Type: 'AWS::Cognito::UserPoolClient', Properties: {} },
  },
  Outputs: {},
};

const gen1AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: JSON.stringify({ stackType: 'auth-Cognito' }),
  Resources: { UserPool: { Type: 'AWS::Cognito::UserPool', Properties: {} } },
  Outputs: {},
};

describe('AuthRollbackRefactorer.plan()', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  function setupBasicMocks() {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen2-auth',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authMain',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-auth' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-auth' }).resolves({ StackResources: [] });

    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth' }).resolves({
      Stacks: [{ StackName: 'gen2-auth', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-auth' }).resolves({
      Stacks: [
        {
          StackName: 'gen1-auth',
          StackStatus: rs,
          CreationTime: ts,
          Description: gen1AuthTemplate.Description,
          Parameters: [],
          Outputs: [],
        },
      ],
    });

    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(gen2AuthTemplate) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });
  }

  it('main auth only: produces move operations (no updateSource/updateTarget for rollback)', async () => {
    setupBasicMocks();
    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const refactorer = new AuthRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      clients,
      'us-east-1',
      '123',
    );

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Rollback: no updateSource/updateTarget, just move ops + afterMove
    expect(descriptions.every((d) => !d.includes('Update source') && !d.includes('Update target'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Move'))).toBe(true);
  });
});
