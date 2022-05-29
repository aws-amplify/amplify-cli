import {
  addRestContainerApi,
  amplifyConfigureProject,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  getProjectMeta,
  modifyRestAPI,
  retry,
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
    const apiName = 'containersimpletest';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot, { apiName });
    await amplifyPushWithoutCodegen(projRoot);
    const awsExports: any = getAWSExports(projRoot).default;
    const {
      aws_cloud_logic_custom: [{ name, endpoint }],
    } = awsExports;
    expect(name).toBeDefined();
    expect(endpoint).toBeDefined();

    const url = `${endpoint}/images`;
    const expected = 'Processing images...';
    const result = await retry(
      async (): Promise<string> => (await fetch(url)).text(),
      (fetchResult: string) => fetchResult === expected,
      {
        times: 100,
        delayMS: 100,
        // five minutes
        timeoutMS: 300000,
        stopOnError: false,
      },
    );
    expect(result).toEqual(expected);
  });

  it('init project, enable containers and add multicontainer api push, edit and push', async () => {
    const envName = 'devtest';
    const apiName = 'containermodifyapi';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot, { apiName });
    await amplifyPushWithoutCodegen(projRoot);
    const meta = await getProjectMeta(projRoot);
    const api = Object.keys(meta.api)[0];
    modifyRestAPI(projRoot, api);
    await amplifyPushWithoutCodegen(projRoot);
  });
});
