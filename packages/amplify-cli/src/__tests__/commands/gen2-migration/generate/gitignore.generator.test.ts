import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';
import { GitIgnoreGenerator } from '../../../../commands/gen2-migration/generate/gitignore.generator';

jest.unmock('fs-extra');

describe('GitIgnoreGenerator', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'gitignore-gen-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('returns exactly one operation', async () => {
    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    expect(ops).toHaveLength(1);
  });

  it('creates .gitignore with Gen2 entries when file does not exist', async () => {
    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(content).toContain('.amplify');
    expect(content).toContain('amplify_outputs*');
    expect(content).toContain('amplifyconfiguration*');
    expect(content).toContain('aws-exports*');
    expect(content).toContain('node_modules');
  });

  it('removes Gen1 amplify-do-not-edit block', async () => {
    const gen1Content = [
      'node_modules',
      '#amplify-do-not-edit-begin',
      'amplify/\\#current-cloud-backend',
      'amplify/.config/local-*',
      '#amplify-do-not-edit-end',
      'dist',
    ].join('\n');
    await fs.writeFile(path.join(tempDir, '.gitignore'), gen1Content);

    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(content).not.toContain('#amplify-do-not-edit-begin');
    expect(content).not.toContain('#amplify-do-not-edit-end');
    expect(content).not.toContain('amplify/\\#current-cloud-backend');
  });

  it('preserves existing non-Gen1 entries', async () => {
    await fs.writeFile(path.join(tempDir, '.gitignore'), 'dist\ncoverage\n');

    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(content).toContain('dist');
    expect(content).toContain('coverage');
  });

  it('does not duplicate entries that already exist', async () => {
    await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules\n.amplify\n');

    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    const amplifyMatches = content.match(/\.amplify/g) || [];
    expect(amplifyMatches).toHaveLength(1);
  });
});
