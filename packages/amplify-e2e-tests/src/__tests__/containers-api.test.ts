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
} from 'amplify-e2e-core';
import fetch from 'node-fetch';
import { getAWSExports } from '../aws-exports/awsExports';

const MAX_RETRIES = 100;
const RETRY_TIMEOUT_SECONDS = 1;

async function setupAmplifyProject(cwd: string) {
  await amplifyConfigureProject({
    cwd,
    enableContainers: true,
  });
}

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

    const result = await retry(`${endpoint}/images`, 'Processing images...');
    expect(result).toEqual('Processing images...');
  });

  it('init project, enable containers and add multicontainer api push, edit and push', async () => {
    const envName = 'devtest';
    const apiName = 'containermodifyapi';
    await initJSProjectWithProfile(projRoot, { name: 'multicontainer', envName });
    await setupAmplifyProject(projRoot);
    await addRestContainerApi(projRoot, { apiName });
    await amplifyPushWithoutCodegen(projRoot);
    const meta = await getProjectMeta(projRoot);
    const api = Object.keys(meta['api'])[0];
    modifyRestAPI(projRoot, api);
    await amplifyPushWithoutCodegen(projRoot);
  });

});
