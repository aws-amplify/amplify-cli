/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  addHeadlessApi,
  amplifyPush,
  amplifyPushUpdate,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getCLIInputs,
  getProjectMeta,
  getProjectSchema,
  getSchemaPath,
  getTransformConfig,
  updateHeadlessApi,
} from '@aws-amplify/amplify-e2e-core';
import { AddApiRequest, UpdateApiRequest } from 'amplify-headless-interface';
import * as fs from 'fs-extra';
import { join } from 'path';
import { initJSProjectWithProfileV4_52_0 } from '../../../migration-helpers';

describe('api migration update test d', () => {
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

  const addApiRequest: AddApiRequest = {
    version: 1,
    serviceConfiguration: {
      serviceName: 'AppSync',
      apiName: 'myApiName',
      transformSchema: fs.readFileSync(getSchemaPath('simple_model.graphql'), 'utf8'),
      defaultAuthType: {
        mode: 'API_KEY',
      },
    },
  };

  const updateApiRequest: UpdateApiRequest = {
    version: 1,
    serviceModification: {
      serviceName: 'AppSync',
      transformSchema: fs.readFileSync(getSchemaPath('simple_model_override.graphql'), 'utf8'),
      defaultAuthType: {
        mode: 'AWS_IAM',
      },
      additionalAuthTypes: [
        {
          mode: 'API_KEY',
        },
      ],
      conflictResolution: {
        defaultResolutionStrategy: {
          type: 'OPTIMISTIC_CONCURRENCY',
        },
      },
    },
  };
  it('updates AppSync API in headless mode', async () => {
    await initJSProjectWithProfileV4_52_0(projRoot, {});
    await addHeadlessApi(projRoot, addApiRequest, {
      allowDestructiveUpdates: false,
      testingWithLatestCodebase: false,
    });
    await amplifyPush(projRoot);
    await updateHeadlessApi(projRoot, updateApiRequest, true, { testingWithLatestCodebase: true });
    expect(getCLIInputs(projRoot, 'api', 'myApiName')).toBeDefined();
    await amplifyPushUpdate(projRoot, undefined, undefined, true);

    // verify
    const meta = getProjectMeta(projRoot);
    const { output } = meta.api.myApiName;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);

    expect(getTransformConfig(projRoot, 'myApiName')).toMatchSnapshot();
    expect(output.authConfig).toMatchSnapshot();
    expect(getProjectSchema(projRoot, 'myApiName')).toMatchSnapshot();
  });
});
