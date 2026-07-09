import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { TsConfigGenerator } from '../../../../../commands/gen2-migration/generate/amplify/tsconfig.generator';

jest.unmock('fs-extra');

describe('TsConfigGenerator', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tsconfig-gen-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('writes amplify/tsconfig.json with Gen2 compiler options', async () => {
    const gen = new TsConfigGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'amplify', 'tsconfig.json'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "{
        "compilerOptions": {
          "target": "es2022",
          "module": "es2022",
          "moduleResolution": "bundler",
          "resolveJsonModule": true,
          "esModuleInterop": true,
          "forceConsistentCasingInFileNames": true,
          "strict": true,
          "skipLibCheck": true,
          "paths": {
            "$amplify/*": ["../.amplify/generated/*"]
          }
        }
      }
      "
    `);
  });
});
