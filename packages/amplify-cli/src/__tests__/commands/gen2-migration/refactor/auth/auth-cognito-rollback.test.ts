import { AuthCognitoRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/auth/auth-cognito-rollback';
import { CFNTemplate } from '../../../../../commands/gen2-migration/cfn-template';
import { AwsClients } from '../../../../../commands/gen2-migration/aws-clients';
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
} from '@aws-sdk/client-cloudformation';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';

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
    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
    const refactorer = new AuthCognitoRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      clients,
      'us-east-1',
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
      null as any,
      'us-east-1',
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

  it('maps UserPoolDomain to UserPoolDomain', () => {
    expect(refactorer.testTargetLogicalId('amplifyAuthUserPoolDomain1234', 'AWS::Cognito::UserPoolDomain')).toBe('UserPoolDomain');
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
