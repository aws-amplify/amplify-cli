import { AmplifyYmlGenerator } from '../../../../commands/gen2-migration/generate/amplify.yml.generator';
import { Gen1App } from '../../../../commands/gen2-migration/generate/_infra/gen1-app';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

jest.unmock('fs-extra');

function createMockGen1App(buildSpec?: string): Gen1App {
  return {
    aws: {
      fetchAppBuildSpec: jest.fn().mockResolvedValue(buildSpec),
    },
    appId: 'test-app-id',
  } as unknown as Gen1App;
}

describe('AmplifyYmlGenerator', () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'amplify-yml-test-'));
    originalCwd = process.cwd();
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true });
  });

  it('replaces amplifyPush --simple with Gen2 commands', async () => {
    const buildSpec = ['version: 1', 'backend:', '  phases:', '    build:', '      commands:', '        - amplifyPush --simple'].join('\n');

    const gen1App = createMockGen1App(buildSpec);
    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).not.toContain('amplifyPush');
    expect(content).toContain('npx ampx pipeline-deploy');
    expect(content).toContain('npm ci --cache .npm --prefer-offline');
  });

  it('replaces amplifyPush --force with Gen2 commands', async () => {
    const buildSpec = ['version: 1', 'backend:', '  phases:', '    build:', '      commands:', '        - amplifyPush --force'].join('\n');

    const gen1App = createMockGen1App(buildSpec);
    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).not.toContain('amplifyPush');
    expect(content).toContain('npx ampx pipeline-deploy');
  });

  it('replaces amplifyPush with arbitrary flags', async () => {
    const buildSpec = [
      'version: 1',
      'backend:',
      '  phases:',
      '    build:',
      '      commands:',
      '        - amplifyPush --simple --force --yes',
    ].join('\n');

    const gen1App = createMockGen1App(buildSpec);
    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).not.toContain('amplifyPush');
    expect(content).toContain('npx ampx pipeline-deploy');
  });

  it('does not match amplifyPushSomething (word boundary)', async () => {
    const buildSpec = [
      'version: 1',
      'backend:',
      '  phases:',
      '    build:',
      '      commands:',
      '        - amplifyPushSomething --flag',
    ].join('\n');

    const gen1App = createMockGen1App(buildSpec);
    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).toContain('amplifyPushSomething');
  });

  it('creates a default backend-only spec when no buildspec exists', async () => {
    const gen1App = createMockGen1App(undefined);
    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).toContain('npx ampx pipeline-deploy');
    expect(content).not.toContain('amplifyPush');
  });
});
