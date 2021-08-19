import {
  addRestContainerApi,
  amplifyConfigureProject,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import fetch from 'node-fetch';
import { getAWSExports } from '../aws-exports/awsExports';

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
});
