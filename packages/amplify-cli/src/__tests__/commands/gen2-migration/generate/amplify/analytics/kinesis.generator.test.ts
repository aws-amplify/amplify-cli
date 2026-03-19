import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { AnalyticsKinesisGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/analytics/kinesis.generator';
import { BackendGenerator } from '../../../../../../commands/gen2-migration/generate/amplify/backend.generator';
import { Gen1App } from '../../../../../../commands/gen2-migration/generate/_infra/gen1-app';

jest.unmock('fs-extra');

function createMockGen1App(): Gen1App {
  return {
    envName: 'main',
    meta: jest.fn(),
    rootStackName: 'root-stack',
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

  it('throws when analytics category is missing', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue(undefined);

    const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, 'myKinesis');

    await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
  });

  it('throws when resource is not in analytics category', async () => {
    const gen1App = createMockGen1App();
    (gen1App.meta as jest.Mock).mockReturnValue({
      otherResource: { service: 'Kinesis' },
    });

    const generator = new AnalyticsKinesisGenerator(gen1App, backendGenerator, outputDir, 'myKinesis');

    await expect(generator.plan()).rejects.toThrow('not found in amplify-meta.json');
  });
});
