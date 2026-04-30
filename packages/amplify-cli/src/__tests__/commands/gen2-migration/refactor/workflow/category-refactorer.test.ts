import { StorageS3ForwardRefactorer } from '../../../../../commands/gen2-migration/refactor/storage/storage-forward';
import { StorageS3RollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/storage/storage-rollback';
import { AnalyticsKinesisForwardRefactorer } from '../../../../../commands/gen2-migration/refactor/analytics/analytics-forward';
import { AnalyticsKinesisRollbackRefactorer } from '../../../../../commands/gen2-migration/refactor/analytics/analytics-rollback';
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
  StackStatus,
  CreateChangeSetCommand,
  DescribeChangeSetCommand,
  DeleteChangeSetCommand,
} from '@aws-sdk/client-cloudformation';
import { Cfn } from '../../../../../commands/gen2-migration/refactor/cfn';

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
    StackResources: [nestedStack('storageavatars', 'gen1-storage-stack')],
  });
  cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
    StackResources: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
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
  const clients = new (AwsClients as any)({ region: 'us-east-1' });
  (clients as any).cloudFormation = new CloudFormationClient({});
  const gen1Env = new StackFacade(clients, 'gen1-root');
  const gen2Branch = new StackFacade(clients, 'gen2-root');
  const cfn = new Cfn(new CloudFormationClient({}), noOpLogger());
  const gen1App = { region: 'us-east-1', clients } as unknown as Gen1App;
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
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResources: [] });

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
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [nestedStack('storageavatars', 'gen1-storage-stack')],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({ StackResources: [] });

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
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
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
    expect(ops).toHaveLength(5); // 2 status validations + updateSource + updateTarget + beforeMove (holding)
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
    expect(descriptions[0]).toContain('Update source');
    expect(descriptions[1]).toContain('Update target');
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
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
    });
    // Gen1 nested stacks (destination for rollback)
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [nestedStack('storageavatars', 'gen1-storage-stack')],
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

    // Resources already exist in Gen1 target, so rollback produces no-op
    expect(ops).toHaveLength(4); // 2 status validations + updateSource + updateTarget
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
    expect(ops).toHaveLength(4); // 2 status validations + updateSource + updateTarget
  });
});

import { MIGRATION_PLACEHOLDER_LOGICAL_ID, MIGRATION_PLACEHOLDER_RESOURCE } from '../../../../../commands/gen2-migration/refactor/cfn';

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
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-root' }).resolves({
      StackResources: [nestedStack('storageavatars', 'gen1-storage-stack')],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-root' }).resolves({
      StackResources: [nestedStack('storage0EC3F24A', 'gen2-storage-stack')],
    });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen1-storage-stack' }).resolves({ StackResources: [] });
    cfnMock.on(DescribeStackResourcesCommand, { StackName: 'gen2-storage-stack' }).resolves({ StackResources: [] });
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

  it('passes when destination stack is in UPDATE_ROLLBACK_COMPLETE', async () => {
    // UPDATE_ROLLBACK_COMPLETE is a terminal CFN state from which new updates are permitted.
    // The per-category check accepts it for parity with the root-level validateDeploymentStatus
    // (a prior failed update should not block retrying with a fixed template).
    setupWithStatuses(StackStatus.CREATE_COMPLETE, 'UPDATE_ROLLBACK_COMPLETE' as StackStatus);
    const ops = await createRefactorer().plan();
    const validation = ops[1].validate();
    const result = await validation!.run();
    expect(result.valid).toBe(true);
    expect(result.report).toBeUndefined();
  });

  it('reports failure when destination stack is in ROLLBACK_COMPLETE (non-updatable)', async () => {
    setupWithStatuses(StackStatus.CREATE_COMPLETE, 'ROLLBACK_COMPLETE' as StackStatus);
    const ops = await createRefactorer().plan();
    const validation = ops[1].validate();
    const result = await validation!.run();
    expect(result.valid).toBe(false);
    expect(result.report).toMatch(/gen2-storage-stack.*ROLLBACK_COMPLETE/);
    // Report should mention all three accepted terminal states.
    expect(result.report).toContain('UPDATE_ROLLBACK_COMPLETE');
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

import { ExpectedChange } from '../../../../../commands/gen2-migration/refactor/workflow/category-refactorer';

describe('CategoryRefactorer.updateTarget validate — expected-change allowlist', () => {
  let cfnMock: ReturnType<typeof mockClient>;
  beforeEach(() => {
    cfnMock = mockClient(CloudFormationClient);
    cfnMock.on(CreateChangeSetCommand).resolves({});
    cfnMock.on(DeleteChangeSetCommand).resolves({});
    cfnMock.on(DescribeStacksCommand).resolves({ Stacks: [] });
  });
  afterEach(() => cfnMock.restore());

  /**
   * Returns the updateTarget operation by running plan() against a storage
   * setup where the target changeset is configured via the provided
   * DescribeChangeSet mock. Uses a custom subclass that overrides
   * expectedTargetChanges() so we can exercise the allowlist behavior
   * without depending on auth-specific logic.
   */
  async function runWithChangeSet(opts: {
    changeSet: any;
    allowlist: ExpectedChange[];
  }) {
    setupStorageMocks(cfnMock);
    // updateSource = source stack describe call: return an empty changes array.
    cfnMock.on(DescribeChangeSetCommand).callsFake((input) => {
      if (input.StackName === 'gen2-storage-stack') {
        return { Status: 'CREATE_COMPLETE', StackName: input.StackName, Changes: [], ...opts.changeSet };
      }
      return { Status: 'CREATE_COMPLETE', StackName: input.StackName, Changes: [] };
    });

    const { gen1Env, gen2Branch, cfn, gen1App } = makeInstances();
    const Subclass = class extends StorageS3ForwardRefactorer {
      protected override expectedTargetChanges(): ExpectedChange[] {
        return opts.allowlist;
      }
    };
    const ops = await new Subclass(
      gen1Env,
      gen2Branch,
      gen1App,
      '123',
      noOpLogger(),
      { category: 'storage', resourceName: 'avatars', service: 'S3', key: 'storage:S3' as const },
      cfn,
    ).plan();

    // Op order in plan(): [sourceStatus, destStatus, updateSource, updateTarget, ...]
    const updateTargetOp = ops[3];
    expect(updateTargetOp).toBeDefined();
    return updateTargetOp;
  }

  it('passes when changeset is empty (no changes detected)', async () => {
    const op = await runWithChangeSet({
      changeSet: { Changes: [] },
      allowlist: [],
    });
    const result = await op.validate()!.run();
    expect(result.valid).toBe(true);
    expect(result.report).toBeUndefined();
  });

  it('passes when all diffs are on the expected allowlist', async () => {
    const op = await runWithChangeSet({
      changeSet: {
        Changes: [
          {
            ResourceChange: {
              LogicalResourceId: 'amplifyStorageBucket12345678',
              Action: 'Modify',
              Details: [
                {
                  Target: {
                    Attribute: 'Properties',
                    Name: 'Policy',
                    Path: '/Policy/Foo',
                    BeforeValue: 'X',
                    AfterValue: 'PLACEHOLDER-value',
                  },
                },
              ],
            },
          },
        ],
      },
      allowlist: [
        {
          logicalId: 'amplifyStorageBucket12345678',
          propertyPathPrefix: '/Policy',
          expectedAfterValueSubstring: 'PLACEHOLDER',
        },
      ],
    });
    const result = await op.validate()!.run();
    expect(result.valid).toBe(true);
  });

  it('fails when an unexpected diff exists outside the allowlist', async () => {
    const op = await runWithChangeSet({
      changeSet: {
        Changes: [
          {
            ResourceChange: {
              LogicalResourceId: 'amplifyStorageBucket12345678',
              Action: 'Modify',
              Details: [
                {
                  Target: {
                    Attribute: 'Properties',
                    Name: 'BucketName',
                    Path: '/BucketName',
                    BeforeValue: 'old',
                    AfterValue: 'new',
                  },
                },
              ],
            },
          },
        ],
      },
      allowlist: [
        {
          logicalId: 'amplifyStorageBucket12345678',
          propertyPathPrefix: '/Policy',
          expectedAfterValueSubstring: 'PLACEHOLDER',
        },
      ],
    });
    const result = await op.validate()!.run();
    expect(result.valid).toBe(false);
    expect(result.report).toBeDefined();
    expect(result.report).toContain('amplifyStorageBucket12345678');
    expect(result.report).toContain('/BucketName');
  });
});
