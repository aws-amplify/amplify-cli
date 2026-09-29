import { StorageS3ForwardRefactorer } from '../../../../../commands/gen2-migration/refactor/storage/storage-forward';
import { StorageS3RollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/storage/storage-rollback';
import { AnalyticsKinesisForwardRefactorer } from '../../../../../commands/gen2-migration/refactor/analytics/analytics-forward';
import { AnalyticsKinesisRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/analytics/analytics-rollback';
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
  StackStatus,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DeleteChangeSetCommand,
} from '@aws-sdk/client-cloudformation';
import { Cfn } from '../../../../../commands/gen2-migration/_common/cfn';
import { S3Client } from '@aws-sdk/client-s3';

// Mock S3 globally so uploadTemplate calls succeed
mockClient(S3Client);

const ts = new Date();
const rs = ResourceStatus.CREATE_COMPLETE;
const nestedStack = (logicalId: string, physicalId: string) => ({
  LogicalResourceId: logicalId,
  ResourceType: 'AWS::CloudFormation::Stack',
  PhysicalResourceId: physicalId,
  LastUpdatedTimestamp: ts,
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
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
    StackResourceSummaries: [nestedStack('storageavatars', 'gen1-storage-stack')],
  });
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
    StackResourceSummaries: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
  });
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResourceSummaries: [] });
  cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResourceSummaries: [] });
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
  const clients = new (AwsClients as any)({ region: 'us-east-1' });
  (clients as any).cloudFormation = new CloudFormationClient({});
  const gen1Env = new StackFacade(clients, 'gen1-root');
  const gen2Branch = new StackFacade(clients, 'gen2-root');
  const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
  const cfn = new Cfn(gen1App, noOpLogger());
  return { clients, gen1Env, gen2Branch, cfn, gen1App };
}

describe('CategoryRefactorer.plan() orchestration — via StorageS3ForwardRefactorer', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
  });
  afterEach(() => cfnMock.restore());

  it('throws when both stacks are absent (Path A)', async () => {
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResourceSummaries: [] });

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    await expect(
      new StorageS3ForwardRefactorer(
        gen1Env,
        gen2Branch,
        gen1App,
        '123',
        noOpLogger(),
        {
          category: 'storage',
          resourceName: 'avatars',
          service: 'S3',
          key: 'storage:S3' as const,
        },
        cfn,
      ).plan(),
    ).rejects.toThrow('Unable to find source stack');
  });

  it('throws when source exists but destination does not (Path B)', async () => {
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [nestedStack('storageavatars', 'gen1-storage-stack')],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResourceSummaries: [] });

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    await expect(
      new StorageS3ForwardRefactorer(
        gen1Env,
        gen2Branch,
        gen1App,
        '123',
        noOpLogger(),
        {
          category: 'storage',
          resourceName: 'avatars',
          service: 'S3',
          key: 'storage:S3' as const,
        },
        cfn,
      ).plan(),
    ).rejects.toThrow('Unable to find target stack');
  });

  it('throws when destination exists but source does not (Path B reversed)', async () => {
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen2StorageTemplate) });

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    await expect(
      new StorageS3ForwardRefactorer(
        gen1Env,
        gen2Branch,
        gen1App,
        '123',
        noOpLogger(),
        {
          category: 'storage',
          resourceName: 'avatars',
          service: 'S3',
          key: 'storage:S3' as const,
        },
        cfn,
      ).plan(),
    ).rejects.toThrow('Unable to find source stack');
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

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new StorageS3ForwardRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      {
        category: 'storage',
        resourceName: 'avatars',
        service: 'S3',
        key: 'storage:S3' as const,
      },
      cfn,
    ).plan();
    expect(ops).toHaveLength(7); // 2 status validations + 2 deletion policy validations + updateSource + updateTarget + beforeMove (holding)
  });

  it('produces updateSource → updateTarget → beforeMove → move for forward plan', async () => {
    setupStorageMocks(cfnMock);

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new StorageS3ForwardRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      {
        category: 'storage',
        resourceName: 'avatars',
        service: 'S3',
        key: 'storage:S3' as const,
      },
      cfn,
    ).plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions).toHaveLength(4);
    expect(descriptions[0]).toContain('Prepare source');
    expect(descriptions[1]).toContain('Prepare target');
    expect(descriptions[2]).toContain('holding');
    expect(descriptions[3]).toContain('Move');
  });
});

describe('StorageS3RollbackRefactorer.plan() — rollback without holding stack', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
  });
  afterEach(() => cfnMock.restore());

  it('produces no-op when resources already exist in target', async () => {
    // Default DescribeStacks returns empty (findHoldingStack → null)
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });

    // Gen2 nested stacks (source for rollback)
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
    });
    // Gen1 nested stacks (destination for rollback)
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [nestedStack('storageavatars', 'gen1-storage-stack')],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResourceSummaries: [] });

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

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new StorageS3RollbackRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      {
        category: 'storage',
        resourceName: 'avatars',
        service: 'S3',
        key: 'storage:S3' as const,
      },
      cfn,
    ).plan();

    expect(ops).toHaveLength(6); // 2 status validations + 2 deletion policy validations + updateSource + updateTarget
  });
});

describe('Analytics wiring tests', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
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
    mock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [nestedStack('analyticsGen1', 'gen1-analytics-stack')],
    });
    mock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [nestedStack('analyticsGen2', 'gen2-analytics-stack')],
    });
    mock.on(ListStackResourcesCommand, { StackName: 'gen1-analytics-stack' }).resolves({ StackResourceSummaries: [] });
    mock.on(ListStackResourcesCommand, { StackName: 'gen2-analytics-stack' }).resolves({ StackResourceSummaries: [] });
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
    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new AnalyticsKinesisForwardRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      {
        category: 'analytics',
        resourceName: 'test',
        service: 'Kinesis',
        key: 'analytics:Kinesis' as const,
      },
      cfn,
    ).plan();
    const descriptions = (await Promise.all(ops.map((o) => o.describe()))).flat();

    expect(descriptions).toHaveLength(4);
    expect(descriptions[3]).toContain('Move 1 resource');
  });

  it('rollback: discovers analytics stacks and maps to Gen1 KinesisStream ID', async () => {
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] }); // no holding stack
    setupAnalyticsMocks(cfnMock);
    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new AnalyticsKinesisRollbackRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      {
        category: 'analytics',
        resourceName: 'test',
        service: 'Kinesis',
        key: 'analytics:Kinesis' as const,
      },
      cfn,
    ).plan();

    // Resources already exist in Gen1 target, so rollback produces no-op
    expect(ops).toHaveLength(6); // 2 status validations + 2 deletion policy validations + updateSource + updateTarget
  });
});

import { MIGRATION_PLACEHOLDER_LOGICAL_ID, MIGRATION_PLACEHOLDER_RESOURCE } from '../../../../../commands/gen2-migration/_common/cfn';

describe('stack status validation', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
  });
  afterEach(() => cfnMock.restore());

  function setupWithStatuses(sourceStatus: StackStatus, destStatus: StackStatus) {
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [nestedStack('storageavatars', 'gen1-storage-stack')],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-storage-stack' }).resolves({
      Stacks: [{ StackName: 'gen1-storage-stack', StackStatus: sourceStatus, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-storage-stack' }).resolves({
      Stacks: [{ StackName: 'gen2-storage-stack', StackStatus: destStatus, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen1StorageTemplate) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-storage-stack' }).resolves({ TemplateBody: JSON.stringify(gen2StorageTemplate) });
  }

  function createRefactorer() {
    const { gen1Env, gen2Branch, gen1App, cfn } = makeInstances();
    return new StorageS3ForwardRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'avatars', service: 'S3', key: 'storage:S3' as const },
      cfn,
    );
  }

  it('reports failure when source stack is in UPDATE_IN_PROGRESS', async () => {
    setupWithStatuses('UPDATE_IN_PROGRESS' as StackStatus, StackStatus.CREATE_COMPLETE);
    const ops = await createRefactorer().plan();
    const validation = ops[0].validate();
    const result = await validation!.run();
    expect(result.valid).toBe(false);
    expect(result.report).toMatch(/gen1-storage-stack.*UPDATE_IN_PROGRESS/);
  });

  it('reports failure when destination stack is in UPDATE_ROLLBACK_COMPLETE', async () => {
    setupWithStatuses(StackStatus.CREATE_COMPLETE, 'UPDATE_ROLLBACK_COMPLETE' as StackStatus);
    const ops = await createRefactorer().plan();
    const validation = ops[1].validate();
    const result = await validation!.run();
    expect(result.valid).toBe(false);
    expect(result.report).toMatch(/gen2-storage-stack.*UPDATE_ROLLBACK_COMPLETE/);
  });

  it('passes when both stacks are in CREATE_COMPLETE', async () => {
    setupWithStatuses(StackStatus.CREATE_COMPLETE, StackStatus.CREATE_COMPLETE);
    const ops = await createRefactorer().plan();
    const sourceResult = await ops[0].validate()!.run();
    const destResult = await ops[1].validate()!.run();
    expect(sourceResult.valid).toBe(true);
    expect(destResult.valid).toBe(true);
  });

  it('passes when both stacks are in UPDATE_COMPLETE', async () => {
    setupWithStatuses(StackStatus.UPDATE_COMPLETE, StackStatus.UPDATE_COMPLETE);
    const ops = await createRefactorer().plan();
    const sourceResult = await ops[0].validate()!.run();
    const destResult = await ops[1].validate()!.run();
    expect(sourceResult.valid).toBe(true);
    expect(destResult.valid).toBe(true);
  });
});

describe('placeholder constants', () => {
  it('placeholder resource is a WaitConditionHandle', () => {
    expect(MIGRATION_PLACEHOLDER_RESOURCE.Type).toBe('AWS::CloudFormation::WaitConditionHandle');
  });

  it('placeholder logical ID is MigrationPlaceholder', () => {
    expect(MIGRATION_PLACEHOLDER_LOGICAL_ID).toBe('MigrationPlaceholder');
  });
});

describe('deletion policy validation', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DescribeChangeSetCommand).resolves({ Status: 'CREATE_COMPLETE', Changes: [] });
    cfnMock.on(DeleteChangeSetCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
  });
  afterEach(() => cfnMock.restore());

  it('reports invalid when resources lack DeletionPolicy Retain', async () => {
    // Templates without DeletionPolicy/UpdateReplacePolicy set
    setupStorageMocks(cfnMock);

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new StorageS3ForwardRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'avatars', service: 'S3', key: 'storage:S3' as const },
      cfn,
    ).plan();

    // Deletion policy validations are at indices 2 and 3 (after 2 status validations)
    const sourceValidation = ops[2].validate();
    expect(sourceValidation).toBeDefined();
    const sourceResult = await sourceValidation!.run();
    expect(sourceResult.valid).toBe(false);
    expect(sourceResult.report).toContain('Retain');
  });

  it('reports valid when resources have DeletionPolicy and UpdateReplacePolicy set to Retain', async () => {
    const retainTemplate: CFNTemplate = {
      AWSTemplateFormatVersion: '2010-09-09',
      Description: 'storage with retain',
      Resources: {
        S3Bucket: {
          Type: 'AWS::S3::Bucket',
          Properties: {},
          DeletionPolicy: 'Retain',
          UpdateReplacePolicy: 'Retain',
        },
      },
      Outputs: {},
    };

    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResourceSummaries: [nestedStack('storageavatars', 'gen1-storage-stack')],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResourceSummaries: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
    });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(ListStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResourceSummaries: [] });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen1-storage-stack' }).resolves({
      Stacks: [{ StackName: 'gen1-storage-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(DescribeStacksCommand, { StackName: 'gen2-storage-stack' }).resolves({
      Stacks: [{ StackName: 'gen2-storage-stack', StackStatus: rs, CreationTime: ts, Parameters: [], Outputs: [] }],
    });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen1-storage-stack' }).resolves({ TemplateBody: JSON.stringify(retainTemplate) });
    cfnMock.on(GetTemplateCommand, { StackName: 'gen2-storage-stack' }).resolves({ TemplateBody: JSON.stringify(retainTemplate) });

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const ops = await new StorageS3ForwardRefactorer(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'avatars', service: 'S3', key: 'storage:S3' as const },
      cfn,
    ).plan();

    const sourceValidation = ops[2].validate();
    expect(sourceValidation).toBeDefined();
    const sourceResult = await sourceValidation!.run();
    expect(sourceResult.valid).toBe(true);

    const targetValidation = ops[3].validate();
    expect(targetValidation).toBeDefined();
    const targetResult = await targetValidation!.run();
    expect(targetResult.valid).toBe(true);
  });
});
