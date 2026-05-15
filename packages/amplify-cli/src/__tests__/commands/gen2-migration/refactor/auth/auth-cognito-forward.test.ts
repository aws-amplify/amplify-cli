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
  ListStackResourcesCommand,
  ResourceStatus,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  ExecuteChangeSetCommand,
  DeleteChangeSetCommand,
  ResourceMapping,
} from '@aws-sdk/client-cloudformation';
import { SSMClient } from '@aws-sdk/client-ssm';
import {
  CognitoIdentityProviderClient,
  DescribeUserPoolCommand,
  ListIdentityProvidersCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';
import { S3Client } from '@aws-sdk/client-s3';

// Mock S3 globally so uploadTemplate calls succeed
mockClient(S3Client);

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
      LastUpdatedTimestamp: ts,
      ResourceStatus: rs,
    },
  ];

  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResourceSummaries: gen1NestedStacks });
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
    StackResourceSummaries: [
      {
        LogicalResourceId: 'authStack',
        ResourceType: 'AWS::CloudFormation::Stack',
        PhysicalResourceId: 'gen2-auth-stack',
        LastUpdatedTimestamp: ts,
        ResourceStatus: rs,
      },
    ],
  });
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-auth-stack' }).resolves({ StackResourceSummaries: [] });
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth-stack' }).resolves({ StackResourceSummaries: [] });

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
      new Cfn({ region: 'us-east-1', clients } as unknown as Gen1App, noOpLogger()),
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
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authtestStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth-stack',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResourceSummaries: [] });
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
      new Cfn({ region: 'us-east-1', clients } as unknown as Gen1App, noOpLogger()),
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

describe('AuthCognitoForwardRefactorer — holding stack behavior', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  let ssmMock: ReturnType<typeof mockClient>;
  let cognitoMock: ReturnType<typeof mockClient>;

  const gen2AuthTemplateWithSocialAuth: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'gen2 auth',
    Resources: {
      amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
      amplifyAuthUserPoolDomain12345678: {
        Type: 'AWS::Cognito::UserPoolDomain',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: { Domain: 'test-domain', UserPoolId: 'us-east-1_TEST' },
      },
      amplifyAuthUserPoolIdentityProviderGoogle12345678: {
        Type: 'AWS::Cognito::UserPoolIdentityProvider',
        DeletionPolicy: 'Retain',
        UpdateReplacePolicy: 'Retain',
        Properties: { ProviderName: 'Google', ProviderType: 'Google', UserPoolId: 'us-east-1_TEST' },
      },
    },
    Outputs: {},
  };

  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    ssmMock = mockClient(SSMClient);
    cognitoMock = mockClient(CognitoIdentityProviderClient);
  });

  afterEach(() => {
    cfnMock.restore();
    ssmMock.restore();
    cognitoMock.restore();
  });

  function setupSocialAuthMocks(holdingStackExists: boolean) {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authtestStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth-stack',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen2-auth-stack',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-auth-stack' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth-stack' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'amplifyAuthUserPool12345678',
          ResourceType: 'AWS::Cognito::UserPool',
          PhysicalResourceId: 'us-east-1_TEST',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
        {
          LogicalResourceId: 'amplifyAuthUserPoolDomain12345678',
          ResourceType: 'AWS::Cognito::UserPoolDomain',
          PhysicalResourceId: 'test-domain',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
        {
          LogicalResourceId: 'amplifyAuthUserPoolIdentityProviderGoogle12345678',
          ResourceType: 'AWS::Cognito::UserPoolIdentityProvider',
          PhysicalResourceId: 'Google',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });

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

    if (holdingStackExists) {
      cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-stack-holding' }).resolves({
        Stacks: [{ StackName: 'gen2-auth-stack-holding', StackStatus: 'UPDATE_COMPLETE', CreationTime: ts }],
      });
      cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-stack-holding' }).resolves({
        TemplateBody: JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
          },
          Outputs: {},
        }),
      });
    }

    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth-stack' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });
    cfnMock
      .on(GetTemplateCommand, { StackName: 'gen2-auth-stack' })
      .resolves({ TemplateBody: JSON.stringify(gen2AuthTemplateWithSocialAuth) });

    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).callsFake((input) => ({ Status: 'CREATE_COMPLETE', StackName: input.StackName, Changes: [] }));
    cfnMock.on(ExecuteChangeSetCommand).resolves({});
    cfnMock.on(DeleteChangeSetCommand).resolves({});
  }

  function createForwardRefactorer() {
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1Env = new StackFacade(clients, 'gen1-root');
    const gen2Branch = new StackFacade(clients, 'gen2-root');
    return new AuthCognitoForwardRefactorer(
      gen1Env,
      gen2Branch,
      {
        region: 'us-east-1',
        clients,
        appId: 'appId',
        envName: 'main',
        resourceMetaOutput: () => 'us-east-1_TEST',
      } as unknown as Gen1App,
      '123456789',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn({ region: 'us-east-1', clients } as unknown as Gen1App, noOpLogger()),
    );
  }

  it('beforeMove skips orphan when holding stack exists', async () => {
    setupSocialAuthMocks(true);
    const refactorer = createForwardRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Should NOT contain orphan operation for social auth
    expect(descriptions.some((d) => d.includes('Orphan'))).toBe(false);
  });

  it('beforeMove includes orphan when no holding stack', async () => {
    setupSocialAuthMocks(false);
    const refactorer = createForwardRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Should contain orphan operation for social auth
    expect(descriptions.some((d) => d.includes('Orphan'))).toBe(true);
  });

  it('move skips import when holding stack exists', async () => {
    setupSocialAuthMocks(true);
    const refactorer = createForwardRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Should NOT contain import operation
    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(false);
  });

  it('move includes import when no holding stack', async () => {
    setupSocialAuthMocks(false);
    const refactorer = createForwardRefactorer();

    cognitoMock.on(DescribeUserPoolCommand).resolves({
      UserPool: {
        Id: 'us-east-1_TEST',
        Domain: 'test-domain',
      },
    });
    cognitoMock.on(ListIdentityProvidersCommand).resolves({
      Providers: [{ ProviderName: 'Google', ProviderType: 'Google' }],
    });

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Should contain import operation
    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(true);
  });

  it('throws StackStateError when holding stack is in unexpected state', async () => {
    setupSocialAuthMocks(false);
    // Override the holding stack mock to return an unexpected status
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-stack-holding' }).resolves({
      Stacks: [{ StackName: 'gen2-auth-stack-holding', StackStatus: 'ROLLBACK_COMPLETE', CreationTime: ts }],
    });

    const refactorer = createForwardRefactorer();

    await expect(refactorer.plan()).rejects.toMatchObject({
      name: 'StackStateError',
      message: expect.stringContaining('ROLLBACK_COMPLETE'),
    });
  });
});
