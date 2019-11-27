import { initJSProjectWithProfile, deleteProject, amplifyPushAuth } from '../init';
import { addHelloWorldFunction, functionBuild } from '../categories/function';
import { createNewProjectDir, deleteProjectDir, getProjectMeta, getFunction } from '../utils';

describe('amplify add function', () => {
  let projRoot: string;
  beforeEach(() => {
    projRoot = createNewProjectDir();
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project and add  simple function', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addHelloWorldFunction(projRoot, {});
    await functionBuild(projRoot, {});
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
    expect(functionArn).toBeDefined();
    expect(functionName).toBeDefined();
    expect(region).toBeDefined();
    const cloudFunction = await getFunction(functionName, region);
    expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
  });
});
