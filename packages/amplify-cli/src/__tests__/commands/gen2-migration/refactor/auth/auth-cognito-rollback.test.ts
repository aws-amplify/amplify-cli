import { AuthCognitoRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/auth/auth-cognito-rollback';
import { CFNTemplate } from '../../../../../commands/gen2-migration/_common/cfn-template';
import { AwsClients } from '../../../../../commands/gen2-migration/_common/aws-clients';
import { Gen1App } from '../../../../../commands/gen2-migration/_common/gen1-app';
import { StackFacade } from '../../../../../commands/gen2-migration/refactor/stack-facade';
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
  DeleteChangeSetCommand,
} from '@aws-sdk/client-cloudformation';
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

    // Holding stack for rollback buildResourceMappings
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-holding' }).resolves({
      Stacks: [{ StackName: 'gen2-auth-holding', StackStatus: 'UPDATE_COMPLETE', CreationTime: ts }],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth-holding' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-holding' }).resolves({
      TemplateBody: JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
        },
        Metadata: {
          ForwardMappings: [
            {
              Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPool' },
              Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPool12345678' },
            },
            {
              Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPoolClient' },
              Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678' },
            },
          ],
        },
        Outputs: {},
      }),
    });

    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen2-auth',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authtestMain',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-auth' }).resolves({ StackResourceSummaries: [] });

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
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    const cfn = new Cfn(gen1App, noOpLogger());
    const refactorer = new AuthCognitoRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      cfn,
    );

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Rollback now resolves and updates both stacks before moving
    expect(descriptions.some((d) => d.includes('Prepare source'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Prepare target'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Move'))).toBe(true);
  });
});

describe('AuthCognitoRollbackRefactorer — holding stack behavior', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  let cognitoMock: ReturnType<typeof mockClient>;

  const gen2AuthTemplateWithSocialAuth: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'gen2 auth',
    Resources: {
      amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
      amplifyAuthUserPoolAppClient12345678: { Type: 'AWS::Cognito::UserPoolClient', Properties: {} },
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
    cognitoMock = mockClient(CognitoIdentityProviderClient);
  });

  afterEach(() => {
    cfnMock.restore();
    cognitoMock.restore();
  });

  function setupRollbackMocks(holdingStackExists: boolean) {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen2-auth',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authtestMain',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'amplifyAuthUserPool12345678',
          ResourceType: 'AWS::Cognito::UserPool',
          PhysicalResourceId: 'us-east-1_TEST',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
        {
          LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678',
          ResourceType: 'AWS::Cognito::UserPoolClient',
          PhysicalResourceId: 'client-id',
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
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-auth' }).resolves({ StackResourceSummaries: [] });

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

    if (holdingStackExists) {
      cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-holding' }).resolves({
        Stacks: [{ StackName: 'gen2-auth-holding', StackStatus: 'UPDATE_COMPLETE', CreationTime: ts }],
      });
      // holding stack has a user pool
      cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth-holding' }).resolves({
        StackResourceSummaries: [
          {
            LogicalResourceId: 'amplifyAuthUserPool12345678',
            ResourceType: 'AWS::Cognito::UserPool',
            PhysicalResourceId: 'us-east-1_HOLDING',
            LastUpdatedTimestamp: ts,
            ResourceStatus: rs,
          },
        ],
      });
      cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-holding' }).resolves({
        TemplateBody: JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
          },
          Metadata: {
            ForwardMappings: [
              {
                Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPool' },
                Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPool12345678' },
              },
              {
                Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPoolClient' },
                Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678' },
              },
            ],
          },
          Outputs: {},
        }),
      });
    }

    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(gen2AuthTemplateWithSocialAuth) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });

    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
  }

  function createRollbackRefactorer() {
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    return new AuthCognitoRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(gen1App, noOpLogger()),
    );
  }

  it('move includes orphan when holding stack exists', async () => {
    setupRollbackMocks(true);
    const refactorer = createRollbackRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Orphan'))).toBe(true);
  });

  it('move skips orphan when no holding stack', async () => {
    setupRollbackMocks(false);
    const refactorer = createRollbackRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Orphan'))).toBe(false);
  });

  it('afterMove includes import when holding stack exists', async () => {
    setupRollbackMocks(true);

    cognitoMock.on(DescribeUserPoolCommand).resolves({
      UserPool: { Id: 'us-east-1_HOLDING', Domain: 'test-domain' },
    });
    cognitoMock.on(ListIdentityProvidersCommand).resolves({
      Providers: [{ ProviderName: 'Google', ProviderType: 'Google' }],
    });

    const refactorer = createRollbackRefactorer();
    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(true);
  });

  it('afterMove skips import when no holding stack', async () => {
    setupRollbackMocks(false);
    const refactorer = createRollbackRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(false);
  });

  it('throws StackStateError when holding stack is in unexpected state', async () => {
    setupRollbackMocks(false);
    // Override the holding stack mock to return an unexpected status
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-holding' }).resolves({
      Stacks: [{ StackName: 'gen2-auth-holding', StackStatus: 'ROLLBACK_COMPLETE', CreationTime: ts }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-holding' }).resolves({
      TemplateBody: JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
        },
        Metadata: {
          ForwardMappings: [
            {
              Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPool' },
              Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPool12345678' },
            },
            {
              Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPoolClient' },
              Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678' },
            },
          ],
        },
        Outputs: {},
      }),
    });

    const refactorer = createRollbackRefactorer();

    await expect(refactorer.plan()).rejects.toMatchObject({
      name: 'StackStateError',
      message: expect.stringContaining('ROLLBACK_COMPLETE'),
    });
  });
});

describe('AuthCognitoRollbackRefactorer — holding stack behavior', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  let cognitoMock: ReturnType<typeof mockClient>;

  const gen2AuthTemplateWithSocialAuth: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'gen2 auth',
    Resources: {
      amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
      amplifyAuthUserPoolAppClient12345678: { Type: 'AWS::Cognito::UserPoolClient', Properties: {} },
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
    cognitoMock = mockClient(CognitoIdentityProviderClient);
  });

  afterEach(() => {
    cfnMock.restore();
    cognitoMock.restore();
  });

  function setupRollbackMocks(holdingStackExists: boolean) {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authStack',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen2-auth',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'authtestMain',
          ResourceType: 'AWS::CloudFormation::Stack',
          PhysicalResourceId: 'gen1-auth',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
      ],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth' }).resolves({
      StackResourceSummaries: [
        {
          LogicalResourceId: 'amplifyAuthUserPool12345678',
          ResourceType: 'AWS::Cognito::UserPool',
          PhysicalResourceId: 'us-east-1_TEST',
          LastUpdatedTimestamp: ts,
          ResourceStatus: rs,
        },
        {
          LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678',
          ResourceType: 'AWS::Cognito::UserPoolClient',
          PhysicalResourceId: 'client-id',
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
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-auth' }).resolves({ StackResourceSummaries: [] });

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

    if (holdingStackExists) {
      cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-holding' }).resolves({
        Stacks: [{ StackName: 'gen2-auth-holding', StackStatus: 'UPDATE_COMPLETE', CreationTime: ts }],
      });
      // holding stack has a user pool
      cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-auth-holding' }).resolves({
        StackResourceSummaries: [
          {
            LogicalResourceId: 'amplifyAuthUserPool12345678',
            ResourceType: 'AWS::Cognito::UserPool',
            PhysicalResourceId: 'us-east-1_HOLDING',
            LastUpdatedTimestamp: ts,
            ResourceStatus: rs,
          },
        ],
      });
      cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-holding' }).resolves({
        TemplateBody: JSON.stringify({
          AWSTemplateFormatVersion: '2010-09-09',
          Resources: {
            amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
          },
          Metadata: {
            ForwardMappings: [
              {
                Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPool' },
                Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPool12345678' },
              },
              {
                Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPoolClient' },
                Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678' },
              },
            ],
          },
          Outputs: {},
        }),
      });
    }

    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(gen2AuthTemplateWithSocialAuth) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });

    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
  }

  function createRollbackRefactorer() {
    const clients = new (AwsClients as any)({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
    return new AuthCognitoRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      gen1App,
      '123',
      noOpLogger(),
      { category: 'auth', resourceName: 'test', service: 'Cognito', key: 'auth:Cognito' as const },
      new Cfn(gen1App, noOpLogger()),
    );
  }

  it('move includes orphan when holding stack exists', async () => {
    setupRollbackMocks(true);
    const refactorer = createRollbackRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Orphan'))).toBe(true);
  });

  it('move skips orphan when no holding stack', async () => {
    setupRollbackMocks(false);
    const refactorer = createRollbackRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Orphan'))).toBe(false);
  });

  it('afterMove includes import when holding stack exists', async () => {
    setupRollbackMocks(true);

    cognitoMock.on(DescribeUserPoolCommand).resolves({
      UserPool: { Id: 'us-east-1_HOLDING', Domain: 'test-domain' },
    });
    cognitoMock.on(ListIdentityProvidersCommand).resolves({
      Providers: [{ ProviderName: 'Google', ProviderType: 'Google' }],
    });

    const refactorer = createRollbackRefactorer();
    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(true);
  });

  it('afterMove skips import when no holding stack', async () => {
    setupRollbackMocks(false);
    const refactorer = createRollbackRefactorer();

    const ops = await refactorer.plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions.some((d) => d.includes('Import social auth'))).toBe(false);
  });

  it('throws StackStateError when holding stack is in unexpected state', async () => {
    setupRollbackMocks(false);
    // Override the holding stack mock to return an unexpected status
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-auth-holding' }).resolves({
      Stacks: [{ StackName: 'gen2-auth-holding', StackStatus: 'ROLLBACK_COMPLETE', CreationTime: ts }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth-holding' }).resolves({
      TemplateBody: JSON.stringify({
        AWSTemplateFormatVersion: '2010-09-09',
        Resources: {
          amplifyAuthUserPool12345678: { Type: 'AWS::Cognito::UserPool', Properties: {} },
        },
        Metadata: {
          ForwardMappings: [
            {
              Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPool' },
              Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPool12345678' },
            },
            {
              Source: { StackName: 'gen1-auth', LogicalResourceId: 'UserPoolClient' },
              Destination: { StackName: 'gen2-auth', LogicalResourceId: 'amplifyAuthUserPoolAppClient12345678' },
            },
          ],
        },
        Outputs: {},
      }),
    });

    const refactorer = createRollbackRefactorer();

    await expect(refactorer.plan()).rejects.toMatchObject({
      name: 'StackStateError',
      message: expect.stringContaining('ROLLBACK_COMPLETE'),
    });
  });
});
