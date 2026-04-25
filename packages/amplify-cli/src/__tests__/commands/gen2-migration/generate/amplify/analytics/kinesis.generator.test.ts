import { AnalyticsKinesisGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/analytics/kinesis.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';
import { createGen1App } from '../../_helpers/create-gen1-app';

jest.unmock('fs-extra');

jest.mock('cdk-from-cfn', () => ({
  transmute: jest.fn().mockReturnValue('export class TodoKinesis {}'),
}));

const mockMkdir = jest.fn().mockResolvedValue(undefined);
const mockWriteFile = jest.fn().mockResolvedValue(undefined);
jest.mock('node:fs/promises', () => ({
  mkdir: (...args: unknown[]) => mockMkdir(...args),
  writeFile: (...args: unknown[]) => mockWriteFile(...args),
}));

function writtenFile(suffix: string): string {
  const call = mockWriteFile.mock.calls.find((c: unknown[]) => (c[0] as string).endsWith(suffix));
  if (!call) throw new Error(`No writeFile call ending with '${suffix}'`);
  return call[1] as string;
}

/** Minimal amplify-meta for a Kinesis analytics resource. */
function kinesisMeta(resourceName: string, opts?: { shardCount?: string; streamId?: string }): Record<string, unknown> {
  return {
    providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
    analytics: {
      [resourceName]: {
        service: 'Kinesis',
        providerMetadata: { logicalId: 'analyticsLogicalId' },
        output: {
          kinesisStreamShardCount: opts?.shardCount ?? '1',
          kinesisStreamId: opts?.streamId ?? `${resourceName}-stream-abc123`,
        },
      },
    },
  };
}

/** Sets up cloudFormation client mock and json spy after createGen1App. */
function setupKinesisMocks(gen1App: Gen1App): void {
  jest.spyOn(gen1App, 'json').mockReturnValue({ Parameters: {}, Resources: {}, Conditions: {} });
  (gen1App.clients as any).cloudFormation = {
    send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
      if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
        return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
      }
      if (cmd.constructor.name === 'DescribeStacksCommand') {
        return { Stacks: [{ Parameters: [] }] };
      }
      return {};
    }),
  };
}

describe('AnalyticsKinesisGenerator', () => {
  let backendGenerator: BackendGenerator;
  const outputDir = '/fake/output';

  beforeEach(() => {
    jest.clearAllMocks();
    backendGenerator = new BackendGenerator(outputDir);
  });

  describe('error handling', () => {
    it('throws when resourceMeta is missing', async () => {
      const gen1App = await createGen1App({
        providers: { awscloudformation: { StackName: 'amplify-test-main-123456', Region: 'us-east-1' } },
        analytics: {
          myKinesis: { service: 'Kinesis' },
        },
      });
      // resourceMeta will throw because there's no providerMetadata — but the real error
      // comes from the generator calling resourceMeta. Let's just verify it throws.
      jest.spyOn(gen1App, 'json').mockReturnValue({ Parameters: {}, Resources: {}, Conditions: {} });
      (gen1App.clients as any).cloudFormation = { send: jest.fn() };

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'myKinesis',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });

      await expect(generator.plan()).rejects.toThrow();
    });
  });

  describe('resource.ts generation (renderer tests)', () => {
    it('renders a basic analytics resource with construct and export', async () => {
      const gen1App = await createGen1App(kinesisMeta('todoKinesis'));
      setupKinesisMocks(gen1App);

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'todoKinesis',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });
      const ops = await generator.plan();
      // ops[0] is construct generation, ops[1] is resource.ts
      await ops[1].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { CfnResource } from 'aws-cdk-lib';
        import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
        import { TodoKinesis } from './todokinesis-construct';
        import type { Backend } from '../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export function defineAnalytics(backend: Backend) {
          const stack = backend.createStack('analytics');
          const analytics = new TodoKinesis(stack, 'TodoKinesis', {
            kinesisStreamName: 'todoKinesis',
            kinesisStreamShardCount: 1,
            authPolicyName: \`todoKinesis-auth-policy-\${branchName}\`,
            unauthPolicyName: \`todoKinesis-unauth-policy-\${branchName}\`,
            authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
            unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
            branchName,
          });
          for (const cfnResource of stack.node
            .findAll()
            .filter(
              (c) =>
                CfnResource.isCfnResource(c) &&
                c.cfnResourceType === 'AWS::Kinesis::Stream'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
          return analytics;
        }

        export function postRefactor(analytics: TodoKinesis) {
          (analytics.node.findChild('KinesisStream') as CfnStream).name =
            'todoKinesis-stream-abc123';
        }
        "
      `);
    });

    it('renders construct instantiation with higher shard count', async () => {
      const gen1App = await createGen1App(kinesisMeta('myStream', { shardCount: '3', streamId: 'myStream-abc' }));
      setupKinesisMocks(gen1App);

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'myStream',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });
      const ops = await generator.plan();
      await ops[1].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`
        "import { CfnResource } from 'aws-cdk-lib';
        import { CfnStream } from 'aws-cdk-lib/aws-kinesis';
        import { MyStream } from './mystream-construct';
        import type { Backend } from '../backend';

        const branchName = process.env.AWS_BRANCH ?? 'sandbox';

        export function defineAnalytics(backend: Backend) {
          const stack = backend.createStack('analytics');
          const analytics = new MyStream(stack, 'MyStream', {
            kinesisStreamName: 'myStream',
            kinesisStreamShardCount: 3,
            authPolicyName: \`myStream-auth-policy-\${branchName}\`,
            unauthPolicyName: \`myStream-unauth-policy-\${branchName}\`,
            authRoleName: backend.auth.resources.authenticatedUserIamRole.roleName,
            unauthRoleName: backend.auth.resources.unauthenticatedUserIamRole.roleName,
            branchName,
          });
          for (const cfnResource of stack.node
            .findAll()
            .filter(
              (c) =>
                CfnResource.isCfnResource(c) &&
                c.cfnResourceType === 'AWS::Kinesis::Stream'
            )) {
            (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
            (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
          }
          return analytics;
        }

        export function postRefactor(analytics: MyStream) {
          (analytics.node.findChild('KinesisStream') as CfnStream).name =
            'myStream-abc';
        }
        "
      `);
    });
  });

  describe('construct file generation (ops[0])', () => {
    it('writes the construct file via cdk-from-cfn and prettier', async () => {
      const gen1App = await createGen1App(kinesisMeta('todoKinesis'));
      setupKinesisMocks(gen1App);

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'todoKinesis',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      expect(writtenFile('todokinesis-construct.ts')).toMatchInlineSnapshot(`
        "export class TodoKinesis {}
        "
      `);
    });
  });

  describe('preTransmute', () => {
    it('renames env parameter to branchName in CFN template', async () => {
      const gen1App = await createGen1App(kinesisMeta('todoKinesis'));
      jest.spyOn(gen1App, 'json').mockReturnValue({
        Parameters: { env: { Type: 'String' } },
        Resources: {
          MyStream: {
            Type: 'AWS::Kinesis::Stream',
            Properties: { Name: { 'Fn::Sub': '${env}-stream' }, ShardCount: 1 },
          },
        },
        Conditions: {},
      });
      (gen1App.clients as any).cloudFormation = {
        send: jest.fn().mockImplementation((cmd: { constructor: { name: string } }) => {
          if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
            return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
          }
          if (cmd.constructor.name === 'DescribeStacksCommand') {
            return { Stacks: [{ Parameters: [] }] };
          }
          return {};
        }),
      };

      const { transmute } = require('cdk-from-cfn');

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'todoKinesis',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });
      const ops = await generator.plan();
      await ops[0].execute();

      const transmuteCall = transmute.mock.calls[0][0];
      const parsed = JSON.parse(transmuteCall);
      expect(parsed.Parameters).not.toHaveProperty('env');
      expect(parsed.Parameters).toHaveProperty('branchName');
    });
  });
});
