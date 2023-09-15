import {
  addRestApi,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  initJSProjectWithProfile,
  amplifyPushAuth,
  getProjectMeta,
} from '@aws-amplify/amplify-e2e-core';
import fetch from 'node-fetch';
import { v4 as uuid } from 'uuid';

const projName = 'apigwexpresstest';
const [shortId] = uuid().split('-');
const apiName = `expressapi${shortId}`;

describe('API Gateway Express e2e test', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addRestApi(projRoot, { apiName: apiName, projectContainsFunctions: false, isCrud: false }); // rest api with serverless express template
    await amplifyPushAuth(projRoot);
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it(' curd requests to api gateway ', async () => {
    const projMeta = getProjectMeta(projRoot);
    expect(projMeta.api).toBeDefined();
    const apiPath = projMeta?.api?.[apiName]?.output?.RootUrl;
    expect(apiPath).toBeDefined();
    const apiResource = `${apiPath}/items`;

    // GET request
    const resGet = await fetch(apiResource);
    expect(resGet.status).toEqual(200);
    await resGet.json().then((data) => {
      expect(data.success).toEqual('get call succeed!');
    });

    // POST request
    const resPost = await fetch(apiResource, {
      method: 'POST',
      body: JSON.stringify({ msg: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resPost.status).toEqual(200);
    await resPost.json().then((data) => {
      expect(data.success).toEqual('post call succeed!');
      expect(data.body.msg).toEqual('hello');
    });

    // PUT request
    const resPut = await fetch(apiResource, {
      method: 'PUT',
      body: JSON.stringify({ msg: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resPut.status).toEqual(200);
    await resPut.json().then((data) => {
      expect(data.success).toEqual('put call succeed!');
      expect(data.body.msg).toEqual('hello');
    });

    // DELETE request
    const resDelete = await fetch(apiResource, {
      method: 'DELETE',
      body: JSON.stringify({ msg: 'hello' }),
      headers: { 'Content-Type': 'application/json' },
    });
    expect(resDelete.status).toEqual(200);
    await resDelete.json().then((data) => {
      expect(data.success).toEqual('delete call succeed!');
    });
  });
});
