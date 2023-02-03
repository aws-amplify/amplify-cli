import {
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  addFunction,
  generateRandomShortId,
  getTeamProviderInfo,
  getProjectConfig,
  LayerRuntime,
  addLayer,
  addAuthWithEmailVerificationAndUserPoolGroupTriggers,
  amplifyPushLayer,
} from '@aws-amplify/amplify-e2e-core';
import { addEnvironment } from '../environment/env';
import { v4 as uuid } from 'uuid';

describe('clone environment parameters on add environment', () => {
  let projRoot: string;
  let projName: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('upload-delete-parameters-test');
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('adding a new env with clone option should clone env parameters', async () => {
    const initialEnvName = 'enva';
    const secondEnvName = 'envb';
    await initJSProjectWithProfile(projRoot, { envName: initialEnvName });
    ({ projectName: projName } = getProjectConfig(projRoot));

    const fnName = `parameterstestfn${generateRandomShortId()}`;
    await addFunction(projRoot, { name: fnName, functionTemplate: 'Hello World' }, 'nodejs');

    await addAuthWithEmailVerificationAndUserPoolGroupTriggers(projRoot);

    const [shortId] = uuid().split('-');
    const layerName = `simplelayer${shortId}`;
    const runtime: LayerRuntime = 'nodejs';
    await addLayer(projRoot, { runtimes: [runtime], layerName, projName });

    await amplifyPushLayer(projRoot, { acceptSuggestedLayerVersionConfigurations: true });
    const preAddEnvTPI = getTeamProviderInfo(projRoot);
    await addEnvironment(projRoot, { envName: secondEnvName, cloneParams: true });
    const postAddEnvTPI = getTeamProviderInfo(projRoot);
    expect(preAddEnvTPI[initialEnvName].categories).toEqual(postAddEnvTPI[initialEnvName].categories);
    expect(preAddEnvTPI[initialEnvName].categories).toEqual(postAddEnvTPI[secondEnvName].categories);
  });
});
