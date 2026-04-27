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

  it('creates .gitignore with Gen2 entries when file does not exist', async () => {
    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "# amplify
      .amplify
      amplify_outputs*
      amplifyconfiguration*
      aws-exports*
      node_modules
      build
      dist
      "
    `);
  });

  it('removes Gen1 amplify-do-not-edit block and adds Gen2 entries', async () => {
    await fs.writeFile(
      path.join(tempDir, '.gitignore'),
      [
        'node_modules',
        '#amplify-do-not-edit-begin',
        'amplify/\\#current-cloud-backend',
        'amplify/.config/local-*',
        '#amplify-do-not-edit-end',
        'dist',
      ].join('\n'),
    );

    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "node_modules
      dist
      # amplify
      .amplify
      amplify_outputs*
      amplifyconfiguration*
      aws-exports*
      build
      "
    `);
  });

  it('does not duplicate entries that already exist', async () => {
    await fs.writeFile(path.join(tempDir, '.gitignore'), 'node_modules\n.amplify\n');

    const gen = new GitIgnoreGenerator();
    const ops = await gen.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tempDir, '.gitignore'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "node_modules
      .amplify
      amplify_outputs*
      amplifyconfiguration*
      aws-exports*
      build
      dist
      "
    `);
  });
});
