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
          "@aws-amplify/backend": "~1.23.0",
          "@aws-amplify/backend-cli": "~1.9.0",
          "@aws-amplify/backend-data": "~1.6.2",
          "@types/node": "*",
          "aws-cdk": "^2",
          "aws-cdk-lib": "~2.254.0",
          "ci-info": "^4.3.1",
          "constructs": "^10.0.0",
          "esbuild": "^0.27.0",
          "tsx": "^4.20.6"
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
          "@aws-amplify/backend": "~1.23.0",
          "@aws-amplify/backend-cli": "~1.9.0",
          "@aws-amplify/backend-data": "~1.6.2",
          "@types/node": "*",
          "aws-cdk": "^2",
          "aws-cdk-lib": "~2.254.0",
          "ci-info": "^4.3.1",
          "constructs": "^10.0.0",
          "esbuild": "^0.27.0",
          "test-lib": "^3.0.0",
          "tsx": "^4.20.6"
        }
      }
      "
    `);
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
          "@aws-amplify/backend": "~1.23.0",
          "@aws-amplify/backend-cli": "~1.9.0",
          "@aws-amplify/backend-data": "~1.6.2",
          "@types/node": "*",
          "aws-cdk": "^2",
          "aws-cdk-lib": "~2.254.0",
          "ci-info": "^4.3.1",
          "constructs": "^10.0.0",
          "esbuild": "^0.27.0",
          "tsx": "^4.20.6"
        }
      }
      "
    `);
  });

  it('pins aws-cdk-lib and the @aws-amplify/backend family to a peer-compatible reproducible set', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8');
    const pkg = JSON.parse(content) as { devDependencies: Record<string, string> };
    const dev = pkg.devDependencies;

    // aws-cdk-lib and the backend family are bounded to a tilde minor for reproducibility.
    for (const name of ['aws-cdk-lib', '@aws-amplify/backend']) {
      expect(dev[name]).not.toBe('^2');
      expect(dev[name]).not.toBe('^1.18.0');
      expect(dev[name]).toMatch(/^~\d+\.\d+\.\d+$/);
    }

    expect(dev['aws-cdk-lib']).toBe('~2.254.0');
    expect(dev['@aws-amplify/backend']).toBe('~1.23.0');

    // backend-cli MUST be tilde-pinned, not caret: a caret floats to 1.10.0 whose peer
    // aws-cdk-lib ^2.257.0 conflicts with the pinned 2.254.0 => ERESOLVE. The 1.9.x peer
    // (aws-cdk-lib ^2.254.0) is satisfied by 2.254.0.
    expect(dev['@aws-amplify/backend-cli']).toBe('~1.9.0');
    expect(dev['@aws-amplify/backend-data']).toBe('~1.6.2');

    // The aws-cdk CLI versions independently of aws-cdk-lib (2.1xxx line), so it is
    // caret-major only; a ~2.254.0 CLI pin would be ETARGET.
    expect(dev['aws-cdk']).toBe('^2');
  });
});
