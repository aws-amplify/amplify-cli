import {
  addRestApi,
  createNewProjectDir,
  initJSProjectWithProfile,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  amplifyPushAuth,
  addAuthWithGroupsAndAdminAPI,
} from 'amplify-e2e-core';
import { v4 as uuid } from 'uuid';
import { get } from 'lodash';
import fetch from 'node-fetch';

const [shortId] = uuid().split('-');
const projName = `apigwtest${shortId}`;

let projRoot: string;
beforeAll(async () => {
  projRoot = await createNewProjectDir(projName);
  await initJSProjectWithProfile(projRoot, { name: projName });
});

afterAll(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

describe('API Gateway e2e tests', () => {
  it('adds multiple rest apis and pushes', async () => {
    await addRestApi(projRoot, {});
    await amplifyPushAuth(projRoot);
    await addAuthWithGroupsAndAdminAPI(projRoot); // Groups: Admins, Users
    await amplifyPushAuth(projRoot);
    await addRestApi(projRoot, { isFirstRestApi: false, path: '/foo', projectContainsFunctions: true });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      restrictAccess: true,
      allowGuestUsers: true,
      hasUserPoolGroups: true,
      projectContainsFunctions: true,
    });
    await amplifyPushAuth(projRoot); // Pushes multiple rest api updates
    const projMeta = getProjectMeta(projRoot);
    expect(projMeta).toBeDefined();
    expect(projMeta.api).toBeDefined();
  });

  it('adds rest api and verify the default 4xx response', async () => {
    const apiName = 'integtest';
    await addRestApi(projRoot, {
      apiName,
    });
    await amplifyPushAuth(projRoot);
    const projMeta = getProjectMeta(projRoot);
    expect(projMeta).toBeDefined();
    expect(projMeta.api).toBeDefined();
    const apiPath = get(projMeta, `api.${apiName}.output.RootUrl`);
    expect(apiPath).toBeDefined();
    const res = await fetch(apiPath);
    expect(res.status).toEqual(403);
    expect(res.headers.get('access-control-allow-headers')).toEqual('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
    expect(res.headers.get('access-control-allow-methods')).toEqual('DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT');
    expect(res.headers.get('access-control-allow-origin')).toEqual('*');
    expect(res.headers.get('access-control-expose-headers')).toEqual('Date,X-Amzn-ErrorType');
  });
});
