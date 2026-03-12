import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { AnalyticsKinesisGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/analytics/kinesis.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate-new/output/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate-new/input/gen1-app';

jest.unmock('fs-extra');

function createMockGen1App(): Gen1App {
  return {
    envName: 'main',
    fetchMetaCategory: jest.fn(),
    fetchRootStackName: jest.fn().mockResolvedValue('root-stack'),
    aws: {
      fetchKinesisStreamDetails: jest.fn(),
    },
    clients: {
      cloudFormation: {},
    },
  } as unknown as Gen1App;
}

describe('AnalyticsKinesisGenerator', () => {
  let outputDir: string;
  let backendGenerator: BackendGenerator;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'kinesis-gen-test-'));
    backendGenerator = new BackendGenerator(outputDir);
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('returns empty operations when analytics category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.fetchMetaCategory as jest.Mock).mockResolvedValue(undefined);

    const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, 'myKinesis');
    const ops = await generator.plan();

    expect(ops).toHaveLength(0);
  });

  it('returns empty operations when resource is not in analytics category', async () => {
    const gen1App = createMockGen1App();
    (gen1App.fetchMetaCategory as jest.Mock).mockResolvedValue({
      otherResource: { service: 'Kinesis' },
    });

    const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, 'myKinesis');
    const ops = await generator.plan();

    expect(ops).toHaveLength(0);
  });
});
