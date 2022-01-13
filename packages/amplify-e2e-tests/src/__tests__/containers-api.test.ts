import {
  addRestContainerApi,
  amplifyConfigureProject,
  amplifyPushWithoutCodegen,
  amplifyPushSecretsWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getProjectMeta,
  modifyRestAPI,
} from 'amplify-e2e-core';
import fetch from 'node-fetch';
import { getAWSExports } from '../aws-exports/awsExports';
import * as fs from 'fs-extra';
import path from 'path';

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

  it('init project, enable containers and add multicontainer api', async () => {
    const envName = 'devtest';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    const awsExports: any = getAWSExports(projRoot).default;
    const {
      aws_cloud_logic_custom: [{ name, endpoint }],
    } = awsExports;
    expect(name).toBeDefined();
    expect(endpoint).toBeDefined();

    const result = await (await fetch(`${endpoint}/images`)).text();
    expect(result).toEqual('Processing images...');
  });

  it('init project, enable containers and add multicontainer api push, edit and push', async () => {
    const envName = 'devtest';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot);
    await amplifyPushWithoutCodegen(projRoot);
    const meta = await getProjectMeta(projRoot);
    const apiName = Object.keys(meta['api'])[0];
    modifyRestAPI(projRoot, apiName);
    await amplifyPushWithoutCodegen(projRoot);
  });

  it('init project, api container secrets should work', async () => {
    const envName = 'devtest';
    const apiName = 'containersecrets';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot, { apiName });
    await setupContainerSecrets(projRoot, apiName)
    await amplifyPushSecretsWithoutCodegen(projRoot);
    const awsExports: any = getAWSExports(projRoot).default;
    const {
      aws_cloud_logic_custom: [{ name, endpoint }],
    } = awsExports;
    expect(name).toBeDefined();
    expect(endpoint).toBeDefined();

    const result = await (await fetch(`${endpoint}/password`)).text();
    expect(result).toEqual('CONTAINER_SECRETS_PASSWORD');
  });

});

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
