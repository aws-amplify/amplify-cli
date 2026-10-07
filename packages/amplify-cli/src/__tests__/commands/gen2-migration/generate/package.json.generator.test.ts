import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { RootPackageJsonGenerator } from '../../../../commands/gen2-migration/generate/package.json.generator';

jest.unmock('fs-extra');

describe('RootPackageJsonGenerator', () => {
  let outputDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pkg-json-gen-test-'));
    originalCwd = process.cwd();
    process.chdir(outputDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('writes package.json with Gen2 dev dependencies when no existing file', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "{
        "name": "amplify-gen2",
        "dependencies": {},
        "devDependencies": {
          "@aws-amplify/backend": "^1.18.0",
          "@aws-amplify/backend-cli": "^1.8.0",
          "@aws-amplify/backend-data": "^1.6.2",
          "@types/node": "*",
          "aws-cdk": "^2",
          "aws-cdk-lib": "^2",
          "ci-info": "^4.3.1",
          "constructs": "^10.0.0",
          "esbuild": "^0.27.0",
          "tsx": "^4.20.6",
          "typescript": "~5.9.3"
        }
      }
      "
    `);
  });

  it('accumulates runtime and dev dependencies from generators', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    gen.addDependency('some-lib', '^1.0.0');
    gen.addDevDependency('test-lib', '^3.0.0');

    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "{
        "name": "amplify-gen2",
        "dependencies": {
          "some-lib": "^1.0.0"
        },
        "devDependencies": {
          "@aws-amplify/backend": "^1.18.0",
          "@aws-amplify/backend-cli": "^1.8.0",
          "@aws-amplify/backend-data": "^1.6.2",
          "@types/node": "*",
          "aws-cdk": "^2",
          "aws-cdk-lib": "^2",
          "ci-info": "^4.3.1",
          "constructs": "^10.0.0",
          "esbuild": "^0.27.0",
          "test-lib": "^3.0.0",
          "tsx": "^4.20.6",
          "typescript": "~5.9.3"
        }
      }
      "
    `);
  });

  it('includes typescript ^5.x in generated devDependencies', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(content.devDependencies).toHaveProperty('typescript');
    expect(content.devDependencies.typescript).toMatch(/^[~^]?5\./);
  });

  it('preserves existing package.json fields', async () => {
    await fs.writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify({ name: 'my-app', scripts: { build: 'tsc' }, dependencies: { react: '^18' } }),
    );

    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "{
        "name": "my-app",
        "scripts": {
          "build": "tsc"
        },
        "dependencies": {
          "react": "^18"
        },
        "devDependencies": {
          "@aws-amplify/backend": "^1.18.0",
          "@aws-amplify/backend-cli": "^1.8.0",
          "@aws-amplify/backend-data": "^1.6.2",
          "@types/node": "*",
          "aws-cdk": "^2",
          "aws-cdk-lib": "^2",
          "ci-info": "^4.3.1",
          "constructs": "^10.0.0",
          "esbuild": "^0.27.0",
          "tsx": "^4.20.6",
          "typescript": "~5.9.3"
        }
      }
      "
    `);
  });
});
