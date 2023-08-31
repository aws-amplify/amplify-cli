import {
  addRestApi,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  amplifyPushAuth,
  addFunction,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

const projName = 'apigwexpresstest';
const [shortId] = uuid().split('-');

describe('API Gateway Express e2e test', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('adds Rest API with express function, pushes and calls the API', async () => {
    const apiName = `expressapi${shortId}`;

    await addFunction(projRoot, { functionTemplate: 'Serverless ExpressJS function (Integration with API Gateway)' }, 'nodejs');
    await addRestApi(projRoot, { apiName: apiName, existingLambda: true, path: '/items' });
    await amplifyPushAuth(projRoot);
    const projMeta = getProjectMeta(projRoot);

    expect(projMeta.api).toBeDefined();
    const apiPath = projMeta?.api?.[apiName]?.output?.RootUrl;
    expect(apiPath).toBeDefined();
    console.log('API Path: ', apiPath);
    const apiResource = apiPath + '/items';
    console.log('API Resource: ', apiResource);
    // await new Promise((r) => setTimeout(r, 20000));
    const res = await fetch(apiResource);
    console.log('API Response: ', res);
    expect(res.status).toEqual(200);
  });
});
