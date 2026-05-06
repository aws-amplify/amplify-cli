import { AuthCognitoForwardRefactorer, buildImportSpec } from '../../../../../commands/gen2-migration/refactor/auth/auth-cognito-forward';
import { CFNResource, CFNTemplate } from '../../../../../commands/gen2-migration/_common/cfn-template';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';
import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { SocialAuthConfig, StackFacade } from '../../../../../commands/gen2-migration/refactor/stack-facade';
import { noOpLogger } from '../../_framework/logger';
import { mockClient } from 'aws-sdk-client-mock';
import {
  CloudFormationClient,
  GetTemplateCommand,
  DescribeStacksCommand,
  DescribeStackResourcesCommand,
  ResourceStatus,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  ExecuteChangeSetCommand,
  DeleteChangeSetCommand,
  ResourceMapping,
} from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';

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
  // Default: no stacks found (used by findStack for holding stacks)
  cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

  const gen1NestedStacks = [
    {
      LogicalResourceId: 'authtestStack',
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

  cfnMock.on(CreateChangeSetCommand).resolves({});
  cfnMock.on(DescribeChangeSetCommand).callsFake((input) => ({ Status: 'CREATE_COMPLETE', StackName: input.StackName, Changes: [] }));
  cfnMock.on(ExecuteChangeSetCommand).resolves({});
  cfnMock.on(DeleteChangeSetCommand).resolves({});
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

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new AuthCognitoForwardRefactorer(
      gen1Env,
      gen2Branch,
      {
        region: 'us-east-1',
        clients,
        appId: 'appId',
        envName: 'main',
        resourceMetaOutput: () => undefined,
      } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(new CloudFormationClient({}), noOpLogger()),
    );

    const ops = await refactorer.plan();
    const descriptions = await Promise.all(ops.map((op) => op.describe()));
    const flat = descriptions.flat();

    // Expected sequence: updateSource, updateTarget, beforeMove (holding), mainAuthMove
    expect(flat).toHaveLength(4);
    expect(flat[0]).toContain('Prepare source');
    expect(flat[1]).toContain('Prepare target');
    expect(flat[2]).toContain('holding');
    expect(flat[3]).toContain('Move');
  });

  it('throws when auth exists in source but not destination', async () => {
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'authtestStack',
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

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new AuthCognitoForwardRefactorer(
      gen1Env,
      gen2Branch,
      {
        region: 'us-east-1',
        clients,
        appId: 'appId',
        envName: 'main',
        resourceMetaOutput: () => undefined,
      } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(new CloudFormationClient({}), noOpLogger()),
    );

    await expect(refactorer.plan()).rejects.toThrow('Unable to find target stack');
  });
});

function toIdMap(mappings: ResourceMapping[]): Map<string, string> {
  return new Map(mappings.map((m) => [m.Source!.LogicalResourceId!, m.Destination!.LogicalResourceId!]));
}

describe('AuthCognitoForwardRefactorer.buildResourceMappings — UserPoolClient disambiguation', () => {
  function createRefactorer() {
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    const gen1Env = new StackFacade(clients, 'gen1');
    const gen2Branch = new StackFacade(clients, 'gen2');
    return new (class extends AuthCognitoForwardRefactorer {
      constructor() {
        super(
          gen1Env,
          gen2Branch,
          {
            region: 'us-east-1',
            clients,
            appId: 'appId',
            envName: 'main',
            resourceMetaOutput: () => undefined,
          } as unknown as Gen1App,
          '123456789',
          noOpLogger(),
          {
            category: 'auth',
            resourceName: 'test',
            service: 'Cognito',
            key: 'auth:Cognito',
          },
          null as unknown as Cfn,
        );
      }
      public async testBuildResourceMappings(
        source: Map<string, CFNResource>,
        target: Map<string, CFNResource>,
      ): Promise<ResourceMapping[]> {
        return this.buildResourceMappings(source, target, 'gen1-auth', 'gen2-auth');
      }
    })();
  }

  it('maps main auth resources with correct Web/Native disambiguation', async () => {
    const refactorer = createRefactorer();

    const targetResources = new Map<string, CFNResource>([
      ['amplifyAuthUserPool1234ABCD', { Type: 'AWS::Cognito::UserPool', Properties: {} }],
      ['amplifyAuthUserPoolAppClient1234ABCD', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['amplifyAuthUserPoolNativeAppClient1234ABCD', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['amplifyAuthIdentityPool1234ABCD', { Type: 'AWS::Cognito::IdentityPool', Properties: {} }],
      ['amplifyAuthIdentityPoolRoleMap1234ABCD', { Type: 'AWS::Cognito::IdentityPoolRoleAttachment', Properties: {} }],
    ]);

    const mainAuthSource = new Map<string, CFNResource>([
      ['UserPool', { Type: 'AWS::Cognito::UserPool', Properties: {} }],
      ['UserPoolClientWeb', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['UserPoolClient', { Type: 'AWS::Cognito::UserPoolClient', Properties: {} }],
      ['IdentityPool', { Type: 'AWS::Cognito::IdentityPool', Properties: {} }],
      ['IdentityPoolRoleMap', { Type: 'AWS::Cognito::IdentityPoolRoleAttachment', Properties: {} }],
    ]);

    const mappings = await refactorer.testBuildResourceMappings(mainAuthSource, targetResources);
    const map = toIdMap(mappings);

    expect(map.size).toBe(5);
    expect(map.get('UserPoolClientWeb')).toBe('amplifyAuthUserPoolAppClient1234ABCD');
    expect(map.get('UserPoolClient')).toBe('amplifyAuthUserPoolNativeAppClient1234ABCD');
    expect(map.get('UserPool')).toBe('amplifyAuthUserPool1234ABCD');
  });
});

describe('buildImportSpec', () => {
  test('throws when Gen1 pool has an IDP that has no matching logical ID in Gen2 template', () => {
    const config: SocialAuthConfig = {
      userPoolId: 'us-east-1_TEST',
      domain: 'test-domain',
      providers: [{ providerName: 'UnknownProvider', providerType: 'OIDC' }],
    };
    expect(() => buildImportSpec(config, 'domainLogicalId', new Map())).toThrow(
      /Identity provider 'UnknownProvider'.*no matching UserPoolIdentityProvider/,
    );
  });
});
