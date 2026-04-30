import { AuthCognitoForwardRefactorer } from '../../../../../commands/gen2-migration/refactor/auth/auth-cognito-forward';
import { CFNResource, CFNTemplate } from '../../../../../commands/gen2-migration/_infra/cfn-template';
import { AwsClients } from '../../../../../commands/gen2-migration/_infra/aws-clients';
import { Gen1App } from '../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { StackFacade } from '../../../../../commands/gen2-migration/refactor/stack-facade';
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
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CognitoIdentityProviderClient,
  DescribeIdentityProviderCommand,
  DescribeUserPoolCommand,
  ListIdentityProvidersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';

// Mock SDK waiters so execute-time tests don't hang on real polling.
jest.mock('@aws-sdk/client-cloudformation', () => {
  const actual = jest.requireActual('@aws-sdk/client-cloudformation');
  return {
    ...actual,
    waitUntilStackUpdateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackCreateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackDeleteComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackRefactorCreateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilStackRefactorExecuteComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
    waitUntilChangeSetCreateComplete: jest.fn().mockResolvedValue({ state: 'SUCCESS' }),
  };
});

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
      { region: 'us-east-1', clients, appId: 'appId', envName: 'main' } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(new CloudFormationClient({}), noOpLogger()),
    );

    const ops = await refactorer.plan();
    const descriptions = await Promise.all(ops.map((op) => op.describe()));
    const flat = descriptions.flat();

    // Expected sequence: updateSource, updateTarget, beforeMove (holding), mainAuthMove.
    // Non-OAuth: no IDP/domain in Gen2 template → no orphan op in beforeMove, no import op in afterMove.
    expect(flat).toHaveLength(4);
    expect(flat[0]).toContain('Update source');
    expect(flat[1]).toContain('Update target');
    expect(flat[2]).toContain('holding');
    expect(flat[3]).toContain('Move');
  });

  it('OAuth: orphans IDPs+domain in beforeMove, imports Gen1 IDPs+domain in move, does not call DescribeIdentityProvider', async () => {
    const oauthGen1Template: CFNTemplate = {
      ...gen1AuthTemplate,
      Parameters: {
        hostedUIProviderMeta: { Type: 'String' },
        hostedUIProviderCreds: { Type: 'String', NoEcho: true },
      },
    };

    // Gen2 template extended to include the typical social-auth-app resources:
    // an IdentityPool with a SupportedLoginProviders Fn::GetAtt to
    // AmplifySecretFetcherResource, plus a UserPoolDomain and a Google IDP.
    const oauthGen2Template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 auth',
      Resources: {
        amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
        amplifyAuthIdentityPool12345678: {
          Type: 'AWS::Cognito::IdentityPool',
          Properties: {
            SupportedLoginProviders: {
              'accounts.google.com': { 'Fn::GetAtt': ['AmplifySecretFetcherResource', 'GOOGLE_CLIENT_ID'] },
            },
          },
        },
        amplifyAuthGoogleIdP12345678: {
          Type: 'AWS::Cognito::UserPoolIdentityProvider',
          Properties: {
            UserPoolId: { Ref: 'amplifyAuthUserPool12345678' },
            ProviderName: 'Google',
            ProviderType: 'Google',
          },
        },
        amplifyAuthUserPoolDomain12345678: {
          Type: 'AWS::Cognito::UserPoolDomain',
          Properties: {
            UserPoolId: { Ref: 'amplifyAuthUserPool12345678' },
            Domain: 'gen2-auto-prefix',
          },
        },
        AmplifySecretFetcherResource: { Type: 'Custom::AmplifySecretFetcherResource', Properties: {} },
      },
      Outputs: {},
    };

    // Default: no stacks found (for holding stack lookup)
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

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
            { ParameterKey: 'hostedUIProviderCreds', ParameterValue: '****' },
          ],
          Outputs: [{ OutputKey: 'UserPoolId', OutputValue: 'us-east-1_ABC123' }],
        },
      ],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-stack' }).resolves({
      Stacks: [{ StackName: 'gen2-auth-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth-stack' }).resolves({ TemplateBody: JSON.stringify(oauthGen1Template) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-stack' }).resolves({ TemplateBody: JSON.stringify(oauthGen2Template) });
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).callsFake((input) => ({ Status: 'CREATE_COMPLETE', StackName: input.StackName, Changes: [] }));
    cfnMock.on(ExecuteChangeSetCommand).resolves({});
    cfnMock.on(DeleteChangeSetCommand).resolves({});

    const cognitoMock = mockClient(CognitoIdentityProviderClient);
    cognitoMock.on(DescribeUserPoolCommand).resolves({
      UserPool: { Id: 'us-east-1_ABC123', Domain: 'gen1-prefix' },
    });
    cognitoMock.on(ListIdentityProvidersCommand).resolves({
      Providers: [{ ProviderName: 'Google', ProviderType: 'Google' }],
    });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    (clients as any).cognitoIdentityProvider = new CognitoIdentityProviderClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    const refactorer = new AuthCognitoForwardRefactorer(
      gen1Env,
      gen2Branch,
      { region: 'us-east-1', clients, appId: 'appId', envName: 'main' } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(new CloudFormationClient({}), noOpLogger()),
    );

    const ops = await refactorer.plan();

    // DescribeIdentityProvider is no longer used — the Orphan + Import approach
    // imports IDPs with dummy ProviderDetails; CFN import does not validate
    // property match so real secrets are not needed.
    expect(cognitoMock.commandCalls(DescribeIdentityProviderCommand)).toHaveLength(0);

    const descriptions = (await Promise.all(ops.map((op) => op.describe()))).flat();

    // beforeMove should produce the standard holding-stack move AND both the
    // Retain-set op (sets DeletionPolicy: Retain on Gen2 IDPs + domain) and
    // the orphan operation for the IDP + domain in the Gen2 template.
    expect(descriptions.some((d) => d.includes('Set DeletionPolicy: Retain') && d.includes('social auth'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Orphan') && d.includes('social auth'))).toBe(true);

    // move() should produce the import operation — the import is now appended
    // to move() (runs after super.move()) rather than in afterMove(), so that
    // the Gen1 pool is already in Gen2 when the import executes.
    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(true);

    // Ordering: Retain-set (in beforeMove) must come BEFORE orphan (also in
    // beforeMove), and orphan must come BEFORE import (in move).
    const retainIndex = descriptions.findIndex((d) => d.includes('Set DeletionPolicy: Retain') && d.includes('social auth'));
    const orphanIndex = descriptions.findIndex((d) => d.includes('Orphan') && d.includes('social auth'));
    const importIndex = descriptions.findIndex((d) => d.includes('Import social auth'));
    expect(retainIndex).toBeGreaterThanOrEqual(0);
    expect(orphanIndex).toBeGreaterThanOrEqual(0);
    expect(importIndex).toBeGreaterThanOrEqual(0);
    expect(retainIndex).toBeLessThan(orphanIndex);
    expect(orphanIndex).toBeLessThan(importIndex);

    cognitoMock.restore();
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
      { region: 'us-east-1', clients, appId: 'appId', envName: 'main' } as unknown as Gen1App,
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
          { region: 'us-east-1', clients, appId: 'appId', envName: 'main' } as unknown as Gen1App,
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

/**
 * Verifies that the orphan social auth operation performs the Retain check at
 * execute time (not plan-validate time) — see Fix 3 in the oauth-workspace
 * agent context. The Retain invariant is established by the preceding
 * Retain-set op's execute(); checking it at plan-validation time would fail
 * on first run because plan.validate() runs before any execute().
 */
describe('AuthCognitoForwardRefactorer — orphan op execute-time Retain check', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  class TestRefactorer extends AuthCognitoForwardRefactorer {
    public testBuildOrphanOp(gen2StackId: string) {
      // Exposes the private method for direct testing.
      return (this as unknown as {
        buildOrphanSocialAuthOperation: (id: string) => Promise<import('../../../../../commands/gen2-migration/_infra/operation').AmplifyMigrationOperation | undefined>;
      }).buildOrphanSocialAuthOperation(gen2StackId);
    }
  }

  function createRefactorer() {
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    return new TestRefactorer(
      gen1Env,
      gen2Branch,
      { region: 'us-east-1', clients, appId: 'appId', envName: 'main' } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(new CloudFormationClient({}), noOpLogger()),
    );
  }

  const idpResource = {
    Type: 'AWS::Cognito::UserPoolIdentityProvider',
    Properties: { ProviderName: 'Google', ProviderType: 'Google' },
  } as const;
  const domainResource = {
    Type: 'AWS::Cognito::UserPoolDomain',
    Properties: { Domain: 'gen2-domain' },
  } as const;

  it('validate() returns undefined (check moved to execute-time)', async () => {
    const templateWithoutRetain: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 auth',
      Resources: { amplifyAuthGoogleIdP: idpResource, amplifyAuthUserPoolDomain: domainResource },
      Outputs: {},
    };
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: JSON.stringify(templateWithoutRetain) });

    const op = await createRefactorer().testBuildOrphanOp('gen2-auth-stack');
    expect(op).toBeDefined();
    expect(op!.validate()).toBeUndefined();
  });

  it('execute() throws AmplifyError when any target is missing DeletionPolicy: Retain', async () => {
    const templateMissingRetain: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 auth',
      Resources: {
        amplifyAuthGoogleIdP: idpResource, // no DeletionPolicy
        amplifyAuthUserPoolDomain: { ...domainResource, DeletionPolicy: 'Retain' },
      },
      Outputs: {},
    };
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: JSON.stringify(templateMissingRetain) });
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'gen2-auth-stack', StackStatus: rs, CreationTime: ts, Parameters: [] }],
    });
    cfnMock.on(UpdateStackCommand).resolves({});

    const op = await createRefactorer().testBuildOrphanOp('gen2-auth-stack');
    expect(op).toBeDefined();
    await expect(op!.execute()).rejects.toThrow(/DeletionPolicy: Retain/);
    // Ensure we aborted BEFORE issuing the destructive UpdateStackCommand.
    expect(cfnMock.commandCalls(UpdateStackCommand)).toHaveLength(0);
  });

  it('execute() succeeds when every target has DeletionPolicy: Retain', async () => {
    const templateWithRetain: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 auth',
      Resources: {
        amplifyAuthGoogleIdP: { ...idpResource, DeletionPolicy: 'Retain' },
        amplifyAuthUserPoolDomain: { ...domainResource, DeletionPolicy: 'Retain' },
      },
      Outputs: {},
    };
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: JSON.stringify(templateWithRetain) });
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'gen2-auth-stack', StackStatus: rs, CreationTime: ts, Parameters: [] }],
    });
    cfnMock.on(UpdateStackCommand).resolves({});

    const op = await createRefactorer().testBuildOrphanOp('gen2-auth-stack');
    expect(op).toBeDefined();
    await expect(op!.execute()).resolves.toBeUndefined();
    // The destructive update ran exactly once.
    expect(cfnMock.commandCalls(UpdateStackCommand)).toHaveLength(1);
  });
});
