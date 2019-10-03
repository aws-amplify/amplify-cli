require('../src/aws-matchers/'); // custom matcher for assertion
import { initProjectWithProfile, deleteProject, amplifyPushAuth } from '../src/init';
import { addHelloWorldFunction, functionBuild } from '../src/categories/function';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getFunction } from '../src/utils';

describe('amplify add function', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
    jest.setTimeout(1000 * 60 * 60); // 1 hour
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add  simple function', async () => {
    await initProjectWithProfile(projRoot, {});
    await addHelloWorldFunction(projRoot, {});
    await functionBuild(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(
      meta.function
    ).map(key => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
  });
});
