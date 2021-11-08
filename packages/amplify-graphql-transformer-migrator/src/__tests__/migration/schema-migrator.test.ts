import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { attemptV2TransformerMigration, revertV2Migration } from '../../schema-migrator';
import { prompter } from 'amplify-prompts';
import { FeatureFlags, pathManager } from 'amplify-cli-core';

jest.mock('amplify-prompts');
const prompter_mock = prompter as jest.Mocked<typeof prompter>;
prompter_mock.confirmContinue.mockResolvedValue(true);

const testProjectPath = path.resolve(__dirname, 'mock-projects', 'v1-schema-project');

const resourceDir = (projectDir: string) => path.join(projectDir, 'amplify', 'backend', 'api', 'testapi');
const cliJsonPath = (projectDir: string) => path.join(projectDir, 'amplify', 'cli.json');
const apiName = 'testapi';
const envName = 'testtest';

describe('attemptV2TransformerMigration', () => {
  let tempProjectDir: string;
  beforeEach(async () => {
    const randomSuffix = (Math.random() * 10000).toString().split('.')[0];
    tempProjectDir = path.join(os.tmpdir(), `schema-migrator-test-${randomSuffix}`);
    await fs.copy(testProjectPath, tempProjectDir);
    jest.spyOn(pathManager, 'findProjectRoot').mockReturnValue(tempProjectDir);
    FeatureFlags.initialize({ getCurrentEnvName: () => envName });
  });

  afterEach(async () => {
    await fs.remove(tempProjectDir);
  });

  it('migrates schemas and sets FF', async () => {
    const apiResourceDir = resourceDir(tempProjectDir);
    await attemptV2TransformerMigration(apiResourceDir, apiName, envName);
    expect(await fs.readFile(path.join(apiResourceDir, 'schema', 'Mud.graphql'), 'utf8')).toMatchInlineSnapshot(`
      "type Mud @model @auth(rules: [{allow: public}]) {
        id: ID!
        obligations: [Obligation] @hasMany(indexName: \\"byMud\\", fields: [\\"id\\"])
      }
      "
    `);
    expect(await fs.readFile(path.join(apiResourceDir, 'schema', 'nested', 'Obligation.graphql'), 'utf8')).toMatchInlineSnapshot(`
      "type Obligation @model @auth(rules: [{allow: public}]) {
        id: ID!
        mudID: ID @index(name: \\"byMud\\", sortKeyFields: [\\"content\\"])
        content: String
      }
      "
    `);
    const cliJsonFile = await fs.readJSON(cliJsonPath(tempProjectDir), { encoding: 'utf8' });
    expect(cliJsonFile.features.graphqltransformer.useexperimentalpipelinedtransformer).toBe(true);
    expect(cliJsonFile.features.graphqltransformer.transformerversion).toBe(2);
    expect(cliJsonFile.features.graphqltransformer.suppressschemamigrationprompt).toBe(true);
  });

  it('leaves project unchanged when migrating and rolling back', async () => {
    const apiResourceDir = resourceDir(tempProjectDir);
    await attemptV2TransformerMigration(apiResourceDir, apiName, envName);
    await revertV2Migration(apiResourceDir, envName);
    const projectSchema1 = await fs.readFile(path.join(apiResourceDir, 'schema', 'Mud.graphql'), 'utf8');
    const projectSchema2 = await fs.readFile(path.join(apiResourceDir, 'schema', 'nested', 'Obligation.graphql'), 'utf8');
    const projectCliJson = await fs.readJSON(cliJsonPath(tempProjectDir), { encoding: 'utf8' });

    const origApiResourceDir = resourceDir(testProjectPath);
    const originalSchema1 = await fs.readFile(path.join(origApiResourceDir, 'schema', 'Mud.graphql'), 'utf8');
    const originalSchema2 = await fs.readFile(path.join(origApiResourceDir, 'schema', 'nested', 'Obligation.graphql'), 'utf8');
    const originalCliJson = await fs.readJSON(cliJsonPath(testProjectPath), { encoding: 'utf8' });

    expect(projectSchema1).toEqual(originalSchema1);
    expect(projectSchema2).toEqual(originalSchema2);
    expect(projectCliJson).toEqual(originalCliJson);
  });
});
