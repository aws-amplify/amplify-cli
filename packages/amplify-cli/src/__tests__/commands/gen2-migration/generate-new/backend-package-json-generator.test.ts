import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { BackendPackageJsonGenerator } from '../../../../commands/gen2-migration/generate-new/output/backend-package-json.generator';

jest.unmock('fs-extra');

describe('BackendPackageJsonGenerator', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'backend-pkg-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('returns exactly one operation', async () => {
    const gen = new BackendPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    expect(ops).toHaveLength(1);
  });

  it('writes amplify/package.json with type: module', async () => {
    const gen = new BackendPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'amplify', 'package.json'), 'utf-8'));
    expect(content).toEqual({ type: 'module' });
  });

  it('creates the amplify directory if it does not exist', async () => {
    const gen = new BackendPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const stat = await fs.stat(path.join(outputDir, 'amplify'));
    expect(stat.isDirectory()).toBe(true);
  });

  it('describes the output file path', async () => {
    const gen = new BackendPackageJsonGenerator(outputDir);
    const ops = await gen.plan();
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toBe('Generate amplify/package.json');
  });
});
