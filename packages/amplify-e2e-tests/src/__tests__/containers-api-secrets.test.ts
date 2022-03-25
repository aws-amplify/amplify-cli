import {
  addRestContainerApi,
  amplifyConfigureProject,
  amplifyPushSecretsWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import fetch from 'node-fetch';
import { getAWSExports } from '../aws-exports/awsExports';
import * as fs from 'fs-extra';
import path from 'path';

const MAX_RETRIES = 100;
const RETRY_TIMEOUT_SECONDS = 1;

async function setupAmplifyProject(cwd: string) {
  await amplifyConfigureProject({
    cwd,
    enableContainers: true,
  });
}

describe('amplify api add', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('containers');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, api container secrets should work', async () => {
    const envName = 'devtest';
    const apiName = 'containersecrets';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot, { apiName });
    await setupContainerSecrets(projRoot, apiName);
    await amplifyPushSecretsWithoutCodegen(projRoot);
    const awsExports: any = getAWSExports(projRoot).default;
    const {
      aws_cloud_logic_custom: [{ name, endpoint }],
    } = awsExports;
    expect(name).toBeDefined();
    expect(endpoint).toBeDefined();

    const result = await retry(`${endpoint}/password`, 'CONTAINER_SECRETS_PASSWORD');
    expect(result).toEqual('CONTAINER_SECRETS_PASSWORD');
  });
});

const retry = async (url: string, until: string): Promise<string> => {
  for (let attempted = 0; attempted < MAX_RETRIES; attempted += 1) {
    try {
      const result = await fetch(url); // eslint-disable-line no-await-in-loop
      const text = await result.text(); // eslint-disable-line no-await-in-loop
      if (text === until) {
        return text;
      }
      console.log(`Expected ${until} but got ${text}. Retrying...`);
      await sleep(RETRY_TIMEOUT_SECONDS); // eslint-disable-line no-await-in-loop
    } catch (e) {
      console.log(`Got error ${e.message}. Retrying...`);
      await sleep(RETRY_TIMEOUT_SECONDS); // eslint-disable-line no-await-in-loop
    }
  }
  throw new Error(`Failed after ${MAX_RETRIES} attempts`);
};

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const setupContainerSecrets = async (projRoot: string, apiName: string) => {
  // Get the api folder path
  const apiFolder = path.join(projRoot, 'amplify', 'backend', 'api', apiName);

  // Get the resources folder paths
  const secretsFolder = path.join(__dirname, '..', '..', 'resources', 'api-container', 'secrets');
  const dockerFile = path.join(__dirname, '..', '..', 'resources', 'api-container', 'docker-compose.yml');
  const expressFile = path.join(__dirname, '..', '..', 'resources', 'api-container', 'express', 'secret-password-index.js');

  // Read the docker and express index files from resources
  const dockerFileContents = await fs.readFile(dockerFile);
  const expressFileContents = await fs.readFile(expressFile);

  // Write the files on the project folder
  await fs.copy(secretsFolder, path.join(apiFolder, 'secrets'));
  await fs.writeFile(path.join(apiFolder, 'src', 'docker-compose.yml'), dockerFileContents);
  await fs.writeFile(path.join(apiFolder, 'src', 'express', 'index.js'), expressFileContents);
};
