import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { TsConfigGenerator } from '../../../../commands/gen2-migration/generate-new/output/tsconfig.generator';

jest.unmock('fs-extra');

describe('TsConfigGenerator', () => {
  let outputDir: string;

  beforeEach(async () => {
    outputDir = await fs.mkdtemp(path.join(os.tmpdir(), 'tsconfig-gen-test-'));
  });

  afterEach(async () => {
    await fs.rm(outputDir, { recursive: true, force: true });
  });

  it('returns exactly one operation', async () => {
    const gen = new TsConfigGenerator(outputDir);
    const ops = await gen.plan();
    expect(ops).toHaveLength(1);
  });

  it('writes amplify/tsconfig.json with Gen2 compiler options', async () => {
    const gen = new TsConfigGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'amplify', 'tsconfig.json'), 'utf-8'));
    expect(content.compilerOptions.target).toBe('es2022');
    expect(content.compilerOptions.module).toBe('es2022');
    expect(content.compilerOptions.moduleResolution).toBe('bundler');
    expect(content.compilerOptions.strict).toBe(true);
    expect(content.compilerOptions.skipLibCheck).toBe(true);
    expect(content.compilerOptions.resolveJsonModule).toBe(true);
    expect(content.compilerOptions.esModuleInterop).toBe(true);
    expect(content.compilerOptions.forceConsistentCasingInFileNames).toBe(true);
  });

  it('includes $amplify path mapping', async () => {
    const gen = new TsConfigGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const content = JSON.parse(await fs.readFile(path.join(outputDir, 'amplify', 'tsconfig.json'), 'utf-8'));
    expect(content.compilerOptions.paths['$amplify/*']).toEqual(['../.amplify/generated/*']);
  });

  it('collapses single-element arrays to one line', async () => {
    const gen = new TsConfigGenerator(outputDir);
    const ops = await gen.plan();
    await ops[0].execute();

    const raw = await fs.readFile(path.join(outputDir, 'amplify', 'tsconfig.json'), 'utf-8');
    // The path array should be on a single line, not spread across multiple
    expect(raw).toContain('["../.amplify/generated/*"]');
  });

  it('describes the output file path', async () => {
    const gen = new TsConfigGenerator(outputDir);
    const ops = await gen.plan();
    const descriptions = await ops[0].describe();
    expect(descriptions[0]).toContain('tsconfig.json');
  });
});
