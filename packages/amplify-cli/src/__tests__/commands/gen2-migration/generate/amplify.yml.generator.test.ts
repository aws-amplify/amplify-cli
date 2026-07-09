import { AmplifyYmlGenerator } from '../../../../commands/gen2-migration/generate/amplify.yml.generator';
import { Gen1App } from '../../../../commands/gen2-migration/_common/gen1-app';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

jest.unmock('fs-extra');

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

  it('replaces amplifyPush with Gen2 commands', async () => {
    const buildSpec = ['version: 1', 'backend:', '  phases:', '    build:', '      commands:', '        - amplifyPush --simple'].join('\n');
    const gen1App = { aws: { fetchAppBuildSpec: jest.fn().mockResolvedValue(buildSpec) }, appId: 'test-app-id' } as unknown as Gen1App;

    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "version: 1
      backend:
        phases:
          build:
            commands:
              - npm ci --cache .npm --prefer-offline
              - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
      "
    `);
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
    const gen1App = { aws: { fetchAppBuildSpec: jest.fn().mockResolvedValue(buildSpec) }, appId: 'test-app-id' } as unknown as Gen1App;

    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "version: 1
      backend:
        phases:
          build:
            commands:
              - amplifyPushSomething --flag
      "
    `);
  });

  it('creates a default backend-only spec when no buildspec exists', async () => {
    const gen1App = { aws: { fetchAppBuildSpec: jest.fn().mockResolvedValue(undefined) }, appId: 'test-app-id' } as unknown as Gen1App;

    const generator = new AmplifyYmlGenerator(gen1App);
    const ops = await generator.plan();
    await ops[0].execute();

    const content = await fs.readFile(path.join(tmpDir, 'amplify.yml'), 'utf-8');
    expect(content).toMatchInlineSnapshot(`
      "version: 1
      backend:
        phases:
          build:
            commands:
              - "# Execute Amplify CLI with the helper script"
              - npm ci --cache .npm --prefer-offline
              - npx ampx pipeline-deploy --branch $AWS_BRANCH --app-id $AWS_APP_ID
      frontend:
        phases:
          build:
            commands:
              - mkdir dist
              - touch dist/index.html
        artifacts:
          baseDirectory: dist
          files:
            - "**/*"
      "
    `);
  });
});
