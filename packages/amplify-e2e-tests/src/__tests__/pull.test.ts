/* eslint-disable spellcheck/spell-checker */
import {
  getAppId,
  addApiWithoutSchema,
  updateApiSchema,
  amplifyPull,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addFunction,
  amplifyPushAuth,
  getBackendAmplifyMeta,
  getTeamProviderInfo,
  amplifyPullNonInteractive,
  amplifyPullWithCtrlCOnFrameworkPrompt,
} from '@aws-amplify/amplify-e2e-core';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { addEnvironment } from '../environment/env';

describe('amplify pull in two directories', () => {
  let projRoot: string;
  let projRoot2: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('pull-test');
    projRoot2 = await createNewProjectDir('pull-test-2');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
    deleteProjectDir(projRoot2);
  });

  it('pulling twice with noUpdateBackend does not re-prompt', async () => {
    await initJSProjectWithProfile(projRoot, {
      disableAmplifyAppCreation: false,
      name: 'testapi',
    });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, 'testapi', 'simple_model.graphql');
    await amplifyPush(projRoot);
    const appId = getAppId(projRoot);
    await amplifyPull(projRoot2, { appId, emptyDir: true, noUpdateBackend: true });
    await amplifyPull(projRoot2, { appId, noUpdateBackend: true });
  });

  it('works if previous pull is interrupted', async () => {
    const envName = 'integtest';
    await initJSProjectWithProfile(projRoot, {
      disableAmplifyAppCreation: false,
      envName,
      name: 'testapi',
    });
    const appId = getAppId(projRoot);
    await amplifyPullWithCtrlCOnFrameworkPrompt(projRoot2, { appId, envName });
    await amplifyPull(projRoot2, { appId, envName, emptyDir: true });
  });

  it('appends pulled env to local-aws-info contents instead of overriding existing env', async () => {
    const envName = 'testing';
    const newEnvName = 'newenv';
    const expectedEnvs = [envName, newEnvName];

    // add both envs to project
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
    await addEnvironment(projRoot, { envName: newEnvName });

    // pull twice for both envs in other directory
    const appId = getBackendAmplifyMeta(projRoot)?.providers?.awscloudformation?.AmplifyAppId;
    await amplifyPullNonInteractive(projRoot2, { appId, envName: envName });
    await amplifyPullNonInteractive(projRoot2, { appId, envName: newEnvName });

    // assert that local-aws-info.json contains both envs
    expect(Object.keys(stateManager.getLocalAWSInfo(projRoot2))).toEqual(expectedEnvs);
  });
});

describe('amplify pull', () => {
  const envName = 'testing';
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('pull-test');
    await initJSProjectWithProfile(projRoot, { envName, disableAmplifyAppCreation: false });
  });

  it('preserves team-provider-info contents across restore backend calls', async () => {
    // add a function with an env var and push
    await addFunction(
      projRoot,
      { functionTemplate: 'Hello World', environmentVariables: { key: 'testVar', value: 'testValue' } },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);

    // grab the appId from the meta file
    const appId = getBackendAmplifyMeta(projRoot)?.providers?.awscloudformation?.AmplifyAppId;
    expect(appId).toBeDefined();
    const originalTpi = getTeamProviderInfo(projRoot);

    // remove the #current-cloud-backend directory
    const ccbPath = path.join(projRoot, 'amplify', '#current-cloud-backend');
    await fs.remove(ccbPath);

    // pull the project which will execute the restore backend codepath because of the missing #current-cloud-backend directory
    await amplifyPullNonInteractive(projRoot, { appId, envName });
    const postPullTpi = getTeamProviderInfo(projRoot);

    // assert that the original tpi contents are maintained
    expect(postPullTpi).toEqual(originalTpi);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });
});
