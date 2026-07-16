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

// Provisioning (push) and re-provisioning (rebuild) of a searchable model's OpenSearch
// (t2.small.elasticsearch) domain is inherently slow and emits no CLI output for well over the
// default 20-minute watchdog, tripping "no output received". Raise the no-output timeout for the two
// OpenSearch-bound commands in this test to 40 minutes.
const SEARCHABLE_NO_OUTPUT_TIMEOUT_MS = 40 * 60 * 1000;

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
    await amplifyPushOverride(projRoot, false, {}, SEARCHABLE_NO_OUTPUT_TIMEOUT_MS);
    const projMeta = getProjectMeta(projRoot);
    const apiId = projMeta?.api?.[projName]?.output?.GraphQLAPIIdOutput;
    const region = projMeta?.providers?.awscloudformation?.Region;
    expect(apiId).toBeDefined();
    expect(region).toBeDefined();
    await testTableBeforeRebuildApi(apiId, region, 'Todo');
    await rebuildApi(projRoot, projName, SEARCHABLE_NO_OUTPUT_TIMEOUT_MS);
    await testTableAfterRebuildApi(apiId, region, 'Todo');
  });
});
