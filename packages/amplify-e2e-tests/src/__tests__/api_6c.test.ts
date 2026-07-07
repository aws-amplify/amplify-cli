import {
  createNewProjectDir,
  initJSProjectWithProfile,
  addApiWithoutSchema,
  amplifyOverrideApi,
  amplifyPushOverride,
  deleteProjectDir,
  rebuildApi,
  getProjectMeta,
  updateApiSchema,
  deleteProject,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import * as path from 'path';
import { testTableAfterRebuildApi, testTableBeforeRebuildApi } from '../rebuild-test-helpers';

const projName = 'apitest';

let projRoot;
beforeEach(async () => {
  projRoot = await createNewProjectDir(projName);
});
afterEach(async () => {
  await deleteProject(projRoot, undefined, false, 1000 * 60 * 30);
  deleteProjectDir(projRoot);
});

describe('amplify rebuild api', () => {
  it('recreates tables for searchable models', async () => {
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
    await updateApiSchema(projRoot, projName, 'searchable_model_v2.graphql');
    await amplifyOverrideApi(projRoot);
    const srcOverrideFilePath = path.join(__dirname, '..', '..', 'overrides', 'override-api-gql-searchable.ts');
    const destOverrideFilePath = path.join(projRoot, 'amplify', 'backend', 'api', projName, 'override.ts');
    fs.copyFileSync(srcOverrideFilePath, destOverrideFilePath);
    await amplifyPushOverride(projRoot);
    const projMeta = getProjectMeta(projRoot);
    const apiId = projMeta?.api?.[projName]?.output?.GraphQLAPIIdOutput;
    const region = projMeta?.providers?.awscloudformation?.Region;
    expect(apiId).toBeDefined();
    expect(region).toBeDefined();
    await testTableBeforeRebuildApi(apiId, region, 'Todo');
    await rebuildApi(projRoot, projName);
    await testTableAfterRebuildApi(apiId, region, 'Todo');
  });
});
