import { AuthCognitoRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/auth/auth-cognito-rollback';
import { CFNTemplate } from '../../../../../commands/gen2-migration/_infra/cfn-template';
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
  DeleteChangeSetCommand,
  ExecuteChangeSetCommand,
  UpdateStackCommand,
} from '@aws-sdk/client-cloudformation';
import {
  CognitoIdentityProviderClient,
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

const gen2AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'gen2 auth',
  Resources: {
    amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
    amplifyAuthUserPoolAppClient12345678: { Type: 'AWS::Cognito::UserPoolClient', Properties: {} },
  },
  Outputs: {},
};

const gen1AuthTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: JSON.stringify({ stackType: 'auth-Cognito' }),
  Resources: { UserPool: { Type: 'AWS::Cognito::UserPool', Properties: {} } },
  Outputs: {},
};

describe('AuthCognitoRollbackRefactorer.plan()', () => {
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
          LogicalResourceId: 'authtestMain',
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

    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
  }

  it('main auth: produces updateSource → updateTarget → move → afterMove', async () => {
    setupBasicMocks();
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new AuthCognitoRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      { region: 'us-east-1', clients } as unknown as Gen1App,
      '123',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      cfn,
    );

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Rollback now resolves and updates both stacks before moving
    expect(descriptions.some((d) => d.includes('Update source'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Update target'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Move'))).toBe(true);
  });

  it('OAuth: orphans IDPs+domain in move, re-imports them in afterMove, orphan precedes import', async () => {
    // Gen2 template still contains the IDP + domain resources imported during
    // forward. Rollback's move() orphan runs at execute time — plan-time reads
    // still see the resources.
    const oauthGen2Template: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 auth',
      Resources: {
        amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
        amplifyAuthUserPoolAppClient12345678: { Type: 'AWS::Cognito::UserPoolClient', Properties: {} },
        amplifyAuthGoogleIdP12345678: {
          Type: 'AWS::Cognito::UserPoolIdentityProvider',
          DeletionPolicy: 'Retain',
          Properties: {
            UserPoolId: { Ref: 'amplifyAuthUserPool12345678' },
            ProviderName: 'Google',
            ProviderType: 'Google',
          },
        },
        amplifyAuthUserPoolDomain12345678: {
          Type: 'AWS::Cognito::UserPoolDomain',
          DeletionPolicy: 'Retain',
          Properties: {
            UserPoolId: { Ref: 'amplifyAuthUserPool12345678' },
            Domain: 'p2-domain',
          },
        },
      },
      Outputs: {},
    };

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
          LogicalResourceId: 'authtestMain',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-auth' }).resolves({ StackResources: [] });
    // Gen2 DescribeStackResources — returns the UserPool at execute time.
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-auth' }).resolves({
      StackResources: [
        {
          LogicalResourceId: 'amplifyAuthUserPool12345678',
          ResourceType: 'AWS::Cognito::UserPool',
          PhysicalResourceId: 'us-east-1_P2',
          Timestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });

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

    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(oauthGen2Template) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });

    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(ExecuteChangeSetCommand).resolves({});
    cfnMock.on(DeleteChangeSetCommand).resolves({});

    const cognitoMock = mockClient(CognitoIdentityProviderClient);
    cognitoMock.on(DescribeUserPoolCommand).resolves({
      UserPool: { Id: 'us-east-1_P2', Domain: 'p2-domain' },
    });
    cognitoMock.on(ListIdentityProvidersCommand).resolves({
      Providers: [{ ProviderName: 'Google', ProviderType: 'Google' }],
    });

    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    (clients as any).cognitoIdentityProvider = new CognitoIdentityProviderClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new AuthCognitoRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      { region: 'us-east-1', clients, appId: 'appId', envName: 'main' } as unknown as Gen1App,
      '123',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      cfn,
    );

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // (a) move() should produce both the core refactor move and the orphan op.
    expect(descriptions.some((d) => d.includes('Orphan') && d.includes('imported social auth'))).toBe(true);

    // (a cont.) afterMove() should produce the import op (re-importing Gen2
    // original IDPs + domain back into Gen2 after super.afterMove() restores P2).
    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(true);

    // (b) Ordering: orphan (in move) must come BEFORE import (in afterMove).
    const orphanIndex = descriptions.findIndex((d) => d.includes('Orphan') && d.includes('imported social auth'));
    const importIndex = descriptions.findIndex((d) => d.includes('Import social auth'));
    expect(orphanIndex).toBeGreaterThanOrEqual(0);
    expect(importIndex).toBeGreaterThanOrEqual(0);
    expect(orphanIndex).toBeLessThan(importIndex);

    // (c) Import description lists Google provider and the domain logical ID.
    const importDescription = descriptions[importIndex];
    expect(importDescription).toContain('Google');
    expect(importDescription).toContain('amplifyAuthUserPoolDomain12345678');

    cognitoMock.restore();
  });
});

describe('AuthCognitoRollbackRefactorer.targetLogicalId', () => {
  function createRefactorer() {
    return new (class extends AuthCognitoRollbackRefactorer {
      public testTargetLogicalId(sourceId: string, type: string): string | undefined {
        return this.targetLogicalId(sourceId, { Type: type, Properties: {} });
      }
    })(
      null as any,
      null as any,
      { region: 'us-east-1' } as unknown as Gen1App,
      '123',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      null as unknown as Cfn,
    );
  }

  const refactorer = createRefactorer();

  it('maps UserPool to UserPool', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthUserPool1234', 'AWS::Cognito::UserPool')).toBe('UserPool');
  });

  it('maps IdentityPool to IdentityPool', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthIdentityPool1234', 'AWS::Cognito::IdentityPool')).toBe('IdentityPool');
  });

  it('maps IdentityPoolRoleAttachment to IdentityPoolRoleMap', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthIdentityPoolRoleAttachment1234', 'AWS::Cognito::IdentityPoolRoleAttachment')).toBe(
      'IdentityPoolRoleMap',
    );
  });

  it('returns undefined for UserPoolDomain (excluded from mappings by buildResourceMappings filter)', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthUserPoolDomain1234', 'AWS::Cognito::UserPoolDomain')).toBeUndefined();
  });

  it('maps NativeAppClient to UserPoolClient', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthUserPoolNativeAppClient1234', 'AWS::Cognito::UserPoolClient')).toBe('UserPoolClient');
  });

  it('maps AppClient (web) to UserPoolClientWeb', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthUserPoolAppClient1234', 'AWS::Cognito::UserPoolClient')).toBe('UserPoolClientWeb');
  });

  it('throws for unrecognized UserPoolClient logical ID', () => {
    expect(() => refactorer.testTargetLogicalId('SomeRandomClient', 'AWS::Cognito::UserPoolClient')).toThrow(
      'Unable to determine Gen1 logical ID',
    );
  });

  it('returns undefined for unknown resource type', () => {
    expect(refactorer.testTargetLogicalId('SomeResource', 'AWS::Lambda::Function')).toBeUndefined();
  });
});

/**
 * Verifies that the rollback orphan social auth operation performs the Retain
 * check at execute time (not plan-validate time) — see Fix 3 in the
 * oauth-workspace agent context. This mirrors the forward symmetry: both
 * orphan ops defer the Retain check to execute() to avoid the plan.validate()
 * anti-pattern where validate runs before any execute side-effects.
 */
describe('AuthCognitoRollbackRefactorer — orphan op execute-time Retain check', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  class TestRefactorer extends AuthCognitoRollbackRefactorer {
    public testBuildOrphanOp(gen2StackId: string) {
      return (this as unknown as {
        buildOrphanSocialAuthOperation: (
          id: string,
        ) => Promise<import('../../../../../commands/gen2-migration/_infra/operation').AmplifyMigrationOperation | undefined>;
      }).buildOrphanSocialAuthOperation(gen2StackId);
    }
  }

  function createRefactorer() {
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    return new TestRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
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

    const op = await createRefactorer().testBuildOrphanOp('gen2-auth');
    expect(op).toBeDefined();
    expect(op!.validate()).toBeUndefined();
  });

  it('execute() throws AmplifyError when any target is missing DeletionPolicy: Retain', async () => {
    const templateMissingRetain: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'gen2 auth',
      Resources: {
        amplifyAuthGoogleIdP: idpResource,
        amplifyAuthUserPoolDomain: { ...domainResource, DeletionPolicy: 'Retain' },
      },
      Outputs: {},
    };
    cfnMock.on(GetTemplateCommand).resolves({ TemplateBody: JSON.stringify(templateMissingRetain) });
    cfnMock.on(DescribeStacksCommand).resolves({
      Stacks: [{ StackName: 'gen2-auth', StackStatus: rs, CreationTime: ts, Parameters: [] }],
    });
    cfnMock.on(UpdateStackCommand).resolves({});

    const op = await createRefactorer().testBuildOrphanOp('gen2-auth');
    expect(op).toBeDefined();
    await expect(op!.execute()).rejects.toThrow(/DeletionPolicy: Retain/);
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
      Stacks: [{ StackName: 'gen2-auth', StackStatus: rs, CreationTime: ts, Parameters: [] }],
    });
    cfnMock.on(UpdateStackCommand).resolves({});

    const op = await createRefactorer().testBuildOrphanOp('gen2-auth');
    expect(op).toBeDefined();
    await expect(op!.execute()).resolves.toBeUndefined();
    expect(cfnMock.commandCalls(UpdateStackCommand)).toHaveLength(1);
  });
});
