import {
  addAuthWithGroupsAndAdminAPI,
  addRestApi,
  amplifyOverrideApi,
  amplifyPushAuth,
  buildOverrides,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  get,
  getProjectMeta,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { JSONUtilities, pathManager, stateManager } from '@aws-amplify/amplify-cli-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { v4 as uuid } from 'uuid';
import fetch from 'node-fetch';

const [shortId] = uuid().split('-');
// eslint-disable-next-line spellcheck/spell-checker
const projName = `apigwtest${shortId}`;

describe('API Gateway e2e tests', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
  });

  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('adds multiple rest apis and pushes', async () => {
    const firstRestApiName = `firstE2eRestApi${shortId}`;
    const secondRestApiName = `secondE2eRestApi${shortId}`;

    await addRestApi(projRoot, { apiName: firstRestApiName });
    await amplifyPushAuth(projRoot);
    await addAuthWithGroupsAndAdminAPI(projRoot); // Groups: Admins, Users
    await amplifyPushAuth(projRoot);
    await addRestApi(projRoot, { isFirstRestApi: false, path: '/', projectContainsFunctions: true }); // Add root path
    await addRestApi(projRoot, {
      apiName: secondRestApiName,
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
    expect(projMeta.api.AdminQueries).toBeDefined();
    expect(projMeta.api[firstRestApiName]).toBeDefined();
    expect(projMeta.api[secondRestApiName]).toBeDefined();

    const firstRootUrl = projMeta.api[firstRestApiName].output?.RootUrl;
    const secondRootUrl = projMeta.api[secondRestApiName].output?.RootUrl;
    expect(firstRootUrl).toBeDefined();
    expect(secondRootUrl).toBeDefined();

    const firstItemsResponse = await get(`${firstRootUrl}/items`);
    const rootUrlResponse = await get(firstRootUrl);
    const secondItemsResponse = await get(`${secondRootUrl}/items`);

    const firstItemsResJson = await firstItemsResponse.json();
    const rootUrlResJson = await rootUrlResponse.json();
    const secondItemsResJson = await secondItemsResponse.json();

    expect(firstItemsResJson).toEqual({ success: 'get call succeed!', url: '/items' });
    expect(rootUrlResJson).toEqual({ success: 'get call succeed!', url: '/' });
    expect(secondItemsResJson).toEqual({ message: 'Missing Authentication Token' }); // Restricted API
  });

  it('adds rest api and verify the default 4xx response', async () => {
    // eslint-disable-next-line spellcheck/spell-checker
    const apiName = `integtest${shortId}`;
    await addRestApi(projRoot, {
      apiName,
    });
    await amplifyPushAuth(projRoot);
    const projMeta = getProjectMeta(projRoot);
    expect(projMeta).toBeDefined();
    expect(projMeta.api).toBeDefined();
    const apiPath = projMeta?.api?.[apiName]?.output?.RootUrl;
    expect(apiPath).toBeDefined();
    const res = await fetch(apiPath);
    expect(res.status).toEqual(403);
    expect(res.headers.get('access-control-allow-headers')).toEqual('Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token');
    expect(res.headers.get('access-control-allow-methods')).toEqual('DELETE,GET,HEAD,OPTIONS,PATCH,POST,PUT');
    expect(res.headers.get('access-control-allow-origin')).toEqual('*');
    // eslint-disable-next-line spellcheck/spell-checker
    expect(res.headers.get('access-control-expose-headers')).toEqual('Date,X-Amzn-ErrorType');
  });

  it('adds and overrides a rest api, then pushes', async () => {
    const restApiName = `e2eRestApi${shortId}`;

    await addRestApi(projRoot, { apiName: restApiName });
    await amplifyOverrideApi(projRoot);
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-api-rest.ts');
    const destOverrideTsFilePath = path.join(pathManager.getResourceDirectoryPath(projRoot, 'api', restApiName), 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideTsFilePath);

    await buildOverrides(projRoot);

    const cfnPath = path.join(
      pathManager.getResourceDirectoryPath(projRoot, 'api', restApiName),
      'build',
      `${restApiName}-cloudformation-template.json`,
    );
    const cfn = JSONUtilities.readJson<any>(cfnPath);
    const parameters = stateManager.getResourceParametersJson(projRoot, 'api', restApiName);
    expect(parameters.DESCRIPTION).toBeDefined();
    expect(parameters.DESCRIPTION).toEqual({ 'Fn::Join': [' ', ['Description', 'override', 'successful']] });
    expect(cfn?.Resources?.[restApiName]?.Properties?.Description).toEqual({ Ref: 'DESCRIPTION' });
    await amplifyPushAuth(projRoot);
  });
});
