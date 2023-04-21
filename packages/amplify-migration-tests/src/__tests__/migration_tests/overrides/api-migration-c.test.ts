/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  amplifyPushLegacy,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getCLIInputs,
  getProjectMeta,
  getTransformConfig,
  updateAPIWithResolutionStrategyWithModels,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import { join } from 'path';
import { addApiWithSchemaAndConflictDetectionOldDx, initJSProjectWithProfileV4_52_0 } from '../../../migration-helpers';

describe('api migration update test c', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('graphql-api');
  });

  afterEach(async () => {
    const metaFilePath = join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (fs.existsSync(metaFilePath)) {
      await deleteProject(projRoot, undefined, true);
    }
    deleteProjectDir(projRoot);
  });

  it('init a sync enabled project and update conflict resolution strategy', async () => {
    const name = `syncenabled`;
    // init and add api with locally installed cli
    await initJSProjectWithProfileV4_52_0(projRoot, { name });
    await addApiWithSchemaAndConflictDetectionOldDx(projRoot, 'simple_model.graphql');
    await amplifyPushLegacy(projRoot);
    let transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');

    // update and push with codebase
    await updateAPIWithResolutionStrategyWithModels(projRoot, { testingWithLatestCodebase: true });
    expect(getCLIInputs(projRoot, 'api', 'syncenabled')).toBeDefined();
    transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('OPTIMISTIC_CONCURRENCY');

    await amplifyPushUpdate(projRoot, undefined, true, true);
    const meta = getProjectMeta(projRoot);
    const { output } = meta.api[name];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
  });
});
