import {
  addFunction,
  amplifyPushAuth,
  amplifyPushMissingEnvVar,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getLambdaFunction,
  getProjectMeta,
  getTeamProviderInfo,
  initJSProjectWithProfile,
  setTeamProviderInfo,
  functionBuild,
  getBackendAmplifyMeta,
  amplifyPushForce,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { addEnvironmentYes } from '../environment/env';

describe('function environment variables', () => {
  let projRoot: string;

  beforeEach(async () => {
    projRoot = await createNewProjectDir('functions');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('configures env vars that are accessible in the cloud', async () => {
    await initJSProjectWithProfile(projRoot);
    const functionName = `testfunction${generateRandomShortId()}`;
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: functionName,
        environmentVariables: {
          key: 'FOO_BAR',
          value: 'fooBar',
        },
      },
      'nodejs',
    );
    await amplifyPushAuth(projRoot);
    const meta = getProjectMeta(projRoot);
    const { Region: region } = (Object.values(meta.function)[0] as any).output;
    const funcDef = await getLambdaFunction(`${functionName}-integtest`, region);
    expect(funcDef?.Configuration?.Environment?.Variables?.FOO_BAR).toEqual('fooBar');
  });

  it('resolves missing env vars on push', async () => {
    // add func w/ env var
    await initJSProjectWithProfile(projRoot);
    const functionName = `testfunction${generateRandomShortId()}`;
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: functionName,
        environmentVariables: {
          key: 'FOO_BAR',
          value: 'fooBar',
        },
      },
      'nodejs',
    );

    // remove value in team-provider-info
    const tpi = getTeamProviderInfo(projRoot);
    expect((Object.values(tpi.integtest.categories.function)[0] as any).fooBar).toEqual('fooBar');
    (Object.values(tpi.integtest.categories.function)[0] as any).fooBar = undefined;
    setTeamProviderInfo(projRoot, tpi);

    // push -> should prompt for a new value
    await amplifyPushMissingEnvVar(projRoot, 'newvalue');

    // check new cloud value
    const meta = getProjectMeta(projRoot);
    const { Region: region } = (Object.values(meta.function)[0] as any).output;
    const funcDef = await getLambdaFunction(`${functionName}-integtest`, region);
    expect(funcDef?.Configuration?.Environment?.Variables?.FOO_BAR).toEqual('newvalue');
  });

  it('carries over env vars to new env', async () => {
    // add func w/ env var
    await initJSProjectWithProfile(projRoot);
    const functionName = `testfunction${generateRandomShortId()}`;
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: functionName,
        environmentVariables: {
          key: 'FOO_BAR',
          value: 'fooBar',
        },
      },
      'nodejs',
    );
    await addEnvironmentYes(projRoot, { envName: 'testtest' });

    // value should be copied to new env
    const tpi = getTeamProviderInfo(projRoot);
    expect((Object.values(tpi.testtest.categories.function)[0] as any).fooBar).toEqual('fooBar');
  });

  it('function force push with no change', async () => {
    const projectName = 'functionNoChange';
    const [shortId] = uuid().split('-');
    const functionName = `testfunction${shortId}`;
    await initJSProjectWithProfile(projRoot, { name: projectName });
    await addFunction(
      projRoot,
      {
        functionTemplate: 'Hello World',
        name: functionName,
      },
      'nodejs',
    );
    await functionBuild(projRoot);
    await amplifyPushAuth(projRoot);
    let meta = getBackendAmplifyMeta(projRoot);
    const { lastPushDirHash: beforeDirHash } = meta.function[functionName];
    await amplifyPushForce(projRoot);
    meta = getBackendAmplifyMeta(projRoot);
    const { lastPushDirHash: afterDirHash } = meta.function[functionName];
    expect(beforeDirHash).toBe(afterDirHash);
  });
});
