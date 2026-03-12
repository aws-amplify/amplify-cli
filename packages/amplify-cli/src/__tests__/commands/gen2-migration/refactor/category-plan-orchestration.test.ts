import { StorageForwardRefactorer } from '../../../../commands/gen2-migration/refactor/storage/storage-forward';
import { StorageRollbackRefactorer } from '../../../../commands/gen2-migration/refactor/storage/storage-rollback';
import { AnalyticsForwardRefactorer } from '../../../../commands/gen2-migration/refactor/analytics/analytics-forward';
import { AnalyticsRollbackRefactorer } from '../../../../commands/gen2-migration/refactor/analytics/analytics-rollback';
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
const nestedStack = (logicalId: string, physicalId: string) => ({
  LogicalResourceId: logicalId,
  ResourceType: 'AWS::CloudFormation::Stack',
  PhysicalResourceId: physicalId,
  Timestamp: ts,
  ResourceStatus: rs,
});

const gen1StorageTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'gen1 storage',
  Resources: { S3Bucket: { Type: 'AWS::S3::Bucket', Properties: {} } },
  Outputs: {},
};

const gen2StorageTemplate: CFNTemplate = {
  AWSTemplateFormatVersion: '2010-09-09',
  Description: 'gen2 storage',
  Resources: { amplifyStorageBucket12345678: { Type: 'AWS::S3::Bucket', Properties: {} } },
  Outputs: {},
};

function setupStorageMocks(cfnMock: ReturnType<typeof mockClient>) {
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
    StackResources: [nestedStack('storageGen1', 'gen1-storage-stack')],
  });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
    StackResources: [nestedStack('storageGen2', 'gen2-storage-stack')],
  });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResources: [] });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResources: [] });
  cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-storage-stack' }).resolves({
    Stacks: [{ StackName: 'gen1-storage-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
  });
  cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-storage-stack' }).resolves({
    Stacks: [{ StackName: 'gen2-storage-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
  });
  cfnMock.on(GetTemplateCommand, { StackName: 'gen1-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen1StorageTemplate) });
  cfnMock.on(GetTemplateCommand, { StackName: 'gen2-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen2StorageTemplate) });
}

function makeInstances() {
  const clients = new AwsClients({ region: 'us-east-1' });
  (clients as any).cloudFormation = new CloudFormationClient({});
  const gen1Env = new StackFacade(clients, 'gen1-root');
  const gen2Branch = new StackFacade(clients, 'gen2-root');
  return { clients, gen1Env, gen2Branch };
}

describe('CategoryRefactorer.plan() orchestration — via StorageForwardRefactorer', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('returns empty array when both stacks are absent (Path A)', async () => {
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResources: [] });

    const { clients, gen1Env, gen2Branch } = makeInstances();
    const ops = await new StorageForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan();
    expect(ops).toEqual([]);
  });

  it('throws when source exists but destination does not (Path B)', async () => {
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [nestedStack('storageGen1', 'gen1-storage-stack')],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResources: [] });

    const { clients, gen1Env, gen2Branch } = makeInstances();
    await expect(new StorageForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan()).rejects.toThrow(
      'Category exists in source but not destination',
    );
  });

  it('throws when destination exists but source does not (Path B reversed)', async () => {
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [nestedStack('storageGen2', 'gen2-storage-stack')],
    });

    const { clients, gen1Env, gen2Branch } = makeInstances();
    await expect(new StorageForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan()).rejects.toThrow(
      'Category exists in destination but not source',
    );
  });

  it('returns empty array when no matching resource types in source (Path D)', async () => {
    const noStorageTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'no storage resources',
      Resources: { SomeFunction: { Type: 'AWS::Lambda::Function', Properties: {} } },
      Outputs: {},
    };
    setupStorageMocks(cfnMock);
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-storage-stack' }).resolves({ TemplateBody: JSON.stringify(noStorageTemplate) });

    const { clients, gen1Env, gen2Branch } = makeInstances();
    const ops = await new StorageForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan();
    expect(ops).toEqual([]);
  });

  it('produces updateSource → updateTarget → beforeMove → move for forward plan', async () => {
    setupStorageMocks(cfnMock);

    const { clients, gen1Env, gen2Branch } = makeInstances();
    const ops = await new StorageForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions).toHaveLength(4);
    expect(descriptions[0]).toContain('Update source');
    expect(descriptions[1]).toContain('Update target');
    expect(descriptions[2]).toContain('holding stack');
    expect(descriptions[3]).toContain('Move');
  });
});

describe('StorageRollbackRefactorer.plan() — rollback without holding stack', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  it('produces move only (no updateSource/updateTarget, no afterMove ops)', async () => {
    // Default DescribeStacks returns empty (findHoldingStack → null)
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    // Gen2 nested stacks (source for rollback)
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [nestedStack('storageGen2', 'gen2-storage-stack')],
    });
    // Gen1 nested stacks (destination for rollback)
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [nestedStack('storageGen1', 'gen1-storage-stack')],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResources: [] });

    // Gen2 storage stack description + template (source for rollback)
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-storage-stack' }).resolves({
      Stacks: [{ StackName: 'gen2-storage-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen2StorageTemplate) });

    // Gen1 storage stack description + template (destination for rollback)
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-storage-stack' }).resolves({
      Stacks: [{ StackName: 'gen1-storage-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen1StorageTemplate) });

    const { clients, gen1Env, gen2Branch } = makeInstances();
    const ops = await new StorageRollbackRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    // Rollback: no updateSource/updateTarget, just move
    expect(descriptions.every((d) => !d.includes('Update source') && !d.includes('Update target'))).toBe(true);
    expect(descriptions.some((d) => d.includes('Move'))).toBe(true);
    expect(descriptions).toHaveLength(1);
  });
});

describe('Analytics wiring tests', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
  });
  afterEach(() => cfnMock.restore());

  const gen1AnalyticsTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'gen1 analytics',
    Resources: { KinesisStream: { Type: 'AWS::Kinesis::Stream', Properties: {} } },
    Outputs: {},
  };
  const gen2AnalyticsTemplate: CFNTemplate = {
    AWSTemplateFormatVersion: '2010-09-09',
    Description: 'gen2 analytics',
    Resources: { amplifyAnalyticsStream12345678: { Type: 'AWS::Kinesis::Stream', Properties: {} } },
    Outputs: {},
  };

  function setupAnalyticsMocks(mock: ReturnType<typeof mockClient>) {
    mock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [nestedStack('analyticsGen1', 'gen1-analytics-stack')],
    });
    mock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [nestedStack('analyticsGen2', 'gen2-analytics-stack')],
    });
    mock.on(DescribeStackResourcesCommand, { StackName: 'gen1-analytics-stack' }).resolves({ StackResources: [] });
    mock.on(DescribeStackResourcesCommand, { StackName: 'gen2-analytics-stack' }).resolves({ StackResources: [] });
    mock.on(DescribeStacksCommand, { StackName: 'gen1-analytics-stack' }).resolves({
      Stacks: [{ StackName: 'gen1-analytics-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    mock.on(DescribeStacksCommand, { StackName: 'gen2-analytics-stack' }).resolves({
      Stacks: [{ StackName: 'gen2-analytics-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    mock.on(GetTemplateCommand, { StackName: 'gen1-analytics-stack' }).resolves({ TemplateBody: JSON.stringify(gen1AnalyticsTemplate) });
    mock.on(GetTemplateCommand, { StackName: 'gen2-analytics-stack' }).resolves({ TemplateBody: JSON.stringify(gen2AnalyticsTemplate) });
  }

  it('forward: discovers analytics stacks and maps Kinesis stream', async () => {
    setupAnalyticsMocks(cfnMock);
    const { clients, gen1Env, gen2Branch } = makeInstances();
    const ops = await new AnalyticsForwardRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions).toHaveLength(4);
    expect(descriptions[3]).toContain('Move 1 resource');
  });

  it('rollback: discovers analytics stacks and maps to Gen1 KinesisStream ID', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] }); // no holding stack
    setupAnalyticsMocks(cfnMock);
    const { clients, gen1Env, gen2Branch } = makeInstances();
    const ops = await new AnalyticsRollbackRefactorer(gen1Env, gen2Branch, clients, 'us-east-1', '123').plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions).toHaveLength(1);
    expect(descriptions[0]).toContain('Move 1 resource');
  });
});
