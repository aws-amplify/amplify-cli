import {
  addRestContainerApi,
  amplifyConfigureProject,
  amplifyPushWithoutCodegen,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  generateRandomShortId,
  initJSProjectWithProfile,
  retry,
} from 'amplify-e2e-core';
import fetch from 'node-fetch';
import { getAWSExports } from '../aws-exports/awsExports';

const setupAmplifyProject = async (cwd: string): Promise<void> => {
  await amplifyConfigureProject({
    cwd,
    enableContainers: true,
  });
};

describe('amplify api add', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('containers');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init project, enable containers and add multi-container api', async () => {
    const envName = 'devtest';
    const apiName = `containersimpletest${generateRandomShortId()}`;
    await initJSProjectWithProfile(projRoot, { name: `multict${generateRandomShortId()}`, envName });
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
});
