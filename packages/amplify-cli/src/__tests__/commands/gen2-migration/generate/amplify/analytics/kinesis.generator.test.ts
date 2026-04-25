import { AnalyticsKinesisGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/analytics/kinesis.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

jest.mock('cdk-from-cfn', () => ({
  transmute: jest.fn().mockReturnValue('/* cdk-from-cfn output */'),
}));

jest.mock('prettier', () => ({
  format: jest.fn().mockReturnValue('/* formatted construct */'),
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

function createMockGen1App(): Gen1App {
  return {
    envName: 'main',
    meta: jest.fn(),
    rootStackName: 'root-stack',
    resourceMeta: jest.fn(),
    resourceMetaOutput: jest.fn(),
    json: jest.fn().mockReturnValue({ Parameters: {}, Resources: {}, Conditions: {} }),
    aws: {
      fetchKinesisStreamDetails: jest.fn(),
    },
    clients: {
      cloudFormation: {
        send: jest.fn(),
      },
    },
  } as unknown as Gen1App;
}
/** Sets up Gen1App mocks for a successful kinesis plan(). */
function setupKinesisMocks(gen1App: Gen1App, opts: { resourceName: string; shardCount: number; streamName: string }): void {
  (gen1App.resourceMeta as jest.Mock).mockReturnValue({
    providerMetadata: { logicalId: 'analyticsLogicalId' },
  });
  (gen1App.resourceMetaOutput as jest.Mock).mockImplementation((_resource: unknown, key: string) => {
    if (key === 'kinesisStreamShardCount') return String(opts.shardCount);
    if (key === 'kinesisStreamId') return opts.streamName;
    return undefined;
  });
  (gen1App.clients.cloudFormation.send as jest.Mock).mockImplementation((cmd: { constructor: { name: string } }) => {
    if (cmd.constructor.name === 'DescribeStackResourcesCommand') {
      return { StackResources: [{ PhysicalResourceId: 'nested-stack-id' }] };
    }
    if (cmd.constructor.name === 'DescribeStacksCommand') {
      return { Stacks: [{ Parameters: [] }] };
    }
    return {};
  });
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
      const gen1App = createMockGen1App();
      (gen1App.resourceMeta as jest.Mock).mockImplementation(() => {
        throw new Error('not found in amplify-meta.json');
      });

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'myKinesis',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });

      await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
    });
  });

  describe('resource.ts generation (renderer tests)', () => {
    it('renders a basic analytics resource with construct and export', async () => {
      const gen1App = createMockGen1App();
      setupKinesisMocks(gen1App, {
        resourceName: 'todoKinesis',
        shardCount: 1,
        streamName: 'todoKinesis-stream-abc123',
      });

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'todoKinesis',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });
      const ops = await generator.plan();
      // ops[0] is construct generation, ops[1] is resource.ts
      await ops[1].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`"/* formatted construct */"`);
    });

    it('renders construct instantiation with higher shard count', async () => {
      const gen1App = createMockGen1App();
      setupKinesisMocks(gen1App, {
        resourceName: 'myStream',
        shardCount: 3,
        streamName: 'myStream-abc',
      });

      const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, {
        category: 'analytics',
        resourceName: 'myStream',
        service: 'Kinesis',
        key: 'analytics:Kinesis',
      });
      const ops = await generator.plan();
      await ops[1].execute();

      expect(writtenFile('resource.ts')).toMatchInlineSnapshot(`"/* formatted construct */"`);
    });
  });
});
