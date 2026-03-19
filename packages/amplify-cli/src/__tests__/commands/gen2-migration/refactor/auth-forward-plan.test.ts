import { AuthCognitoForwardRefactorer } from '../../../../commands/gen2-migration/refactor/auth/auth-forward';
import { CFNTemplate } from '../../../../commands/gen2-migration/cfn-template';
import { AwsClients } from '../../../../commands/gen2-migration/aws-clients';
import { StackFacade } from '../../../../commands/gen2-migration/refactor/stack-facade';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  GetTemplateCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  ResourceStatus,
} from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient, DescribeIdentityProviderCommand } from '@aws-sdk/client-cognito-identity-provider';

const ts = new Date();
const rs = ResourceStatus.CREATE_COMPLETE;

const gen1AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: JSON.stringify({ stackType: 'auth-Cognito' }),
  Resources: { UserPool: { Type: 'AWS::Cognito::UserPool', Properties: {} } },
  Outputs: {},
};

const gen2AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'gen2 auth',
  Resources: { amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} } },
  Outputs: {},
};

function setupMocks(cfnMock: ReturnType<typeof mockClient>) {
  const gen1NestedStacks = [
    {
      LogicalResourceId: 'authMainStack',
      ResourceType: 'AWS::CloudFormation::Stack',
      PhysicalResourceId: 'gen1-auth-stack',
      Timestamp: ts,
      ResourceStatus: rs,
    },
  ];

  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResources: gen1NestedStacks });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
    StackResources: [
      {
        LogicalResourceId: 'authStack',
        ResourceType: 'AWS::CloudFormation::Stack',
        PhysicalResourceId: 'gen2-auth-stack',
        Timestamp: ts,
        ResourceStatus: rs,
      },
    ],
  });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-auth-stack' }).resolves({ StackResources: [] });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-auth-stack' }).resolves({ StackResources: [] });

  cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-auth-stack' }).resolves({
    Stacks: [
      {
        StackName: 'gen1-auth-stack',
        StackStatus: rs,
        CreationTime: ts,
        Description: gen1AuthTemplate.Description,
        Parameters: [],
        Outputs: [],
      },
    ],
  });
  cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-stack' }).resolves({
    Stacks: [{ StackName: 'gen2-auth-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
  });

  cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth-stack' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });
  cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-stack' }).resolves({ TemplateBody: JSON.stringify(gen2AuthTemplate) });
}

describe('AuthCognitoForwardRefactorer.plan() — operation sequence', () => {
  let cfnMock: ReturnType<typeof mockClient>;

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    mockClient(SSMClient);
    mockClient(CognitoIdentityProviderClient);
  });

  afterEach(() => {
    cfnMock.restore();
  });

  it('main auth: produces updateSource → updateTarget → beforeMove → move', async () => {
    setupMocks(cfnMock);

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new AuthCognitoForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123456789', 'appId', 'main');

    const ops = await refactorer.plan();
    const descriptions = await Promise.all(ops.map((op) => op.describe()));
    const flat = descriptions.flat();

    // Expected sequence: updateSource, updateTarget, beforeMove (holding), mainAuthMove
    expect(flat).toHaveLength(4);
    expect(flat[0]).toContain('Update source');
    expect(flat[1]).toContain('Update target');
    expect(flat[2]).toContain('holding stack');
    expect(flat[3]).toContain('Move');
  });

  it('OAuth: populates hostedUIProviderCreds when hostedUIProviderMeta parameter exists', async () => {
    const oauthGen1Template: CFNTemplate = {
      ...gen1AuthTemplate,
      Parameters: {
        hostedUIProviderMeta: { Type: 'String' },
        hostedUIProviderCreds: { Type: 'String' },
      },
    };

    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authMainStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth-stack',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen2-auth-stack',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-auth-stack' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-auth-stack' }).resolves({ StackResources: [] });

    cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-auth-stack' }).resolves({
      Stacks: [
        {
          StackName: 'gen1-auth-stack',
          StackStatus: rs,
          CreationTime: ts,
          Description: oauthGen1Template.Description,
          Parameters: [
            { ParameterKey: 'hostedUIProviderMeta', ParameterValue: JSON.stringify([{ ProviderName: 'Google' }]) },
            { ParameterKey: 'hostedUIProviderCreds', ParameterValue: '[]' },
          ],
          Outputs: [{ OutputKey: 'UserPoolId', OutputValue: 'us-east-1_ABC123' }],
        },
      ],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-stack' }).resolves({
      Stacks: [{ StackName: 'gen2-auth-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth-stack' }).resolves({ TemplateBody: JSON.stringify(oauthGen1Template) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-stack' }).resolves({ TemplateBody: JSON.stringify(gen2AuthTemplate) });

    const cognitoMock = mockClient(CognitoIdentityProviderClient);
    cognitoMock.on(DescribeIdentityProviderCommand).resolves({
      IdentityProvider: { ProviderDetails: { client_id: 'google-id', client_secret: 'google-secret' } },
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    (clients as any).cognitoIdentityProvider = new CognitoIdentityProviderClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new AuthCognitoForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123456789', 'appId', 'main');

    const ops = await refactorer.plan();

    expect(cognitoMock.commandCalls(DescribeIdentityProviderCommand)).toHaveLength(1);
    expect(ops.length).toBeGreaterThanOrEqual(4);

    const { UpdateStackCommand } = await import('@aws-sdk/client-cloudformation');
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'gen1-auth-stack', StackStatus: 'UPDATE_COMPLETE', CreationTime: ts }],
    });
    cfnMock.on(UpdateStackCommand).resolves({});
    await ops[0].execute();

    const updateCalls = cfnMock.commandCalls(UpdateStackCommand);
    expect(updateCalls).toHaveLength(1);
    const credsParam = updateCalls[0].args[0].input.Parameters?.find(
      (p: { ParameterKey?: string }) => p.ParameterKey === 'hostedUIProviderCreds',
    );
    expect(credsParam?.ParameterValue).toContain('google-id');
    expect(credsParam?.ParameterValue).toContain('google-secret');

    cognitoMock.restore();
  });

  it('throws when auth exists in source but not destination', async () => {
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authMainStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth-stack',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-auth-stack' }).resolves({
      Stacks: [{ StackName: 'gen1-auth-stack', StackStatus: rs, CreationTime: ts, Description: gen1AuthTemplate.Description }],
    });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new AuthCognitoForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123456789', 'appId', 'main');

    await expect(refactorer.plan()).rejects.toThrow('exists in source but not destination');
  });
});
