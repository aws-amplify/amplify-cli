import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { RootPackageJsonGenerator } from '../../../../commands/gen2-migration/generate-new/output/root-package-json.generator';

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

  it('returns exactly one operation', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    expect(ops).toHaveLength(1);
  });

  it('writes a package.json with Gen2 dev dependencies', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(content.devDependencies['@aws-amplify/backend']).toBeDefined();
    expect(content.devDependencies['aws-cdk-lib']).toBeDefined();
    expect(content.devDependencies['constructs']).toBeDefined();
  });

  it('accumulates runtime dependencies from generators', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    gen.addDependency('some-lib', '^1.0.0');
    gen.addDependency('another-lib', '^2.0.0');

    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(content.dependencies['some-lib']).toBe('^1.0.0');
    expect(content.dependencies['another-lib']).toBe('^2.0.0');
  });

  it('accumulates dev dependencies from generators', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    gen.addDevDependency('test-lib', '^3.0.0');

    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(content.devDependencies['test-lib']).toBe('^3.0.0');
  });

  it('preserves existing package.json fields when file exists', async () => {
    await fs.writeFile(
      path.join(outputDir, 'package.json'),
      JSON.stringify({ name: 'my-app', scripts: { build: 'tsc' }, dependencies: { react: '^18' } }),
    );

    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(content.name).toBe('my-app');
    expect(content.scripts.build).toBe('tsc');
    expect(content.dependencies['react']).toBe('^18');
  });

  it('uses default name when no existing package.json', async () => {
    const gen = new RootPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'package.json'), 'utf-8'));
    expect(content.name).toBe('amplify-gen2');
  });
});
