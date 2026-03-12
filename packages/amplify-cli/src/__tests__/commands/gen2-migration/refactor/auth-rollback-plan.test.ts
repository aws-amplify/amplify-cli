import { AuthRollbackRefactorer } from '../../../../commands/gen2-migration/refactor/auth/auth-rollback';
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

  function setupBasicMocks(opts: { includeUpg?: boolean } = {}) {
    // Default: any unmatched DescribeStacks returns empty (for findHoldingStack)
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    // Gen2 nested stacks
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
    // Gen1 nested stacks
    const gen1Stacks = [
      {
        LogicalResourceId: 'authMain',
        ResourceType: 'AWS::CloudFormation::Stack',
        PhysicalResourceId: 'gen1-auth',
        Timestamp: ts,
        ResourceStatus: rs,
      },
    ];
    if (opts.includeUpg) {
      gen1Stacks.push({
        LogicalResourceId: 'authUpg',
        ResourceType: 'AWS::CloudFormation::Stack',
        PhysicalResourceId: 'gen1-upg',
        Timestamp: ts,
        ResourceStatus: rs,
      });
    }
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResources: gen1Stacks });
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
    // findHoldingStack returns null
    cfnMock.on(DescribeStacksCommand, { StackName: expect.stringContaining('holding') as any }).resolves({ Stacks: [] });

    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(gen2AuthTemplate) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-auth' }).resolves({ TemplateBody: JSON.stringify(gen1AuthTemplate) });

    if (opts.includeUpg) {
      const gen1UpgTemplate: CFNTemplate = {
        AWSTemplateFormatVersion: '2010-09-09',
        Description: JSON.stringify({ stackType: 'auth-Cognito-UserPool-Groups' }),
        Resources: { AdminGroup: { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} } },
        Outputs: {},
      };
      cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-upg' }).resolves({
        Stacks: [
          {
            StackName: 'gen1-upg',
            StackStatus: rs,
            CreationTime: ts,
            Description: gen1UpgTemplate.Description,
            Parameters: [],
            Outputs: [],
          },
        ],
      });
      cfnMock.on(GetTemplateCommand, { StackName: 'gen1-upg' }).resolves({ TemplateBody: JSON.stringify(gen1UpgTemplate) });
      cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-upg' }).resolves({ StackResources: [] });
    }
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

  it('main auth + user pool groups: produces separate move operations for each', async () => {
    // Add UserPoolGroup resource to gen2 template
    const gen2WithUpg: CFNTemplate = {
      ...gen2AuthTemplate,
      Resources: {
        ...gen2AuthTemplate.Resources,
        amplifyAuthAdmins12345678: { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} },
      },
    };
    setupBasicMocks({ includeUpg: true });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(gen2WithUpg) });

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
    const moveOps = descriptions.filter((d) => d.includes('Move'));

    // Should have at least 2 move operations (main auth + user pool groups)
    expect(moveOps.length).toEqual(2);
  });

  it('throws on malformed UserPoolGroup logical ID', async () => {
    // Gen2 template with a UserPoolGroup that doesn't have the amplifyAuth prefix
    const gen2BadUpg: CFNTemplate = {
      ...gen2AuthTemplate,
      Resources: {
        ...gen2AuthTemplate.Resources,
        BadGroupName: { Type: 'AWS::Cognito::UserPoolGroup', Properties: {} },
      },
    };
    setupBasicMocks({ includeUpg: true });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-auth' }).resolves({ TemplateBody: JSON.stringify(gen2BadUpg) });

    const clients = new AwsClients({ region: 'us-east-1' });
    (clients as any).cloudFormation = new CloudFormationClient({});
    const refactorer = new AuthRollbackRefactorer(
      new StackFacade(clients, 'gen1-root'),
      new StackFacade(clients, 'gen2-root'),
      clients,
      'us-east-1',
      '123',
    );

    await expect(refactorer.plan()).rejects.toThrow('Cannot extract Gen1 logical ID');
  });
});
