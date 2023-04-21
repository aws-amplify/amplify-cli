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
  updateApiSchema,
  updateApiWithMultiAuth,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { join } from 'path';
import { addApiWithoutSchemaOldDx, initJSProjectWithProfileV4_52_0 } from '../../../migration-helpers';

describe('api migration update test a', () => {
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

  it('api update migration with multiauth', async () => {
    // init and add api with installed CLI
    await initJSProjectWithProfileV4_52_0(projRoot, { name: 'simplemodelmultiauth' });
    await addApiWithoutSchemaOldDx(projRoot);
    await updateApiSchema(projRoot, 'simplemodelmultiauth', 'simple_model.graphql');
    await amplifyPushLegacy(projRoot);
    // update and push with codebase
    await updateApiWithMultiAuth(projRoot, { testingWithLatestCodebase: true });
    // cli-inputs should exist
    expect(getCLIInputs(projRoot, 'api', 'simplemodelmultiauth')).toBeDefined();
    await amplifyPushUpdate(projRoot, undefined, true, true);

    const meta = getProjectMeta(projRoot);
    const { output } = meta.api.simplemodelmultiauth;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.authenticationType).toEqual('API_KEY');
    expect(graphqlApi.additionalAuthenticationProviders).toHaveLength(3);
    expect(graphqlApi.additionalAuthenticationProviders).toHaveLength(3);

    const cognito = graphqlApi.additionalAuthenticationProviders.filter((a) => a.authenticationType === 'AMAZON_COGNITO_USER_POOLS')[0];

    expect(cognito).toBeDefined();
    expect(cognito.userPoolConfig).toBeDefined();

    const iam = graphqlApi.additionalAuthenticationProviders.filter((a) => a.authenticationType === 'AWS_IAM')[0];

    expect(iam).toBeDefined();

    const oidc = graphqlApi.additionalAuthenticationProviders.filter((a) => a.authenticationType === 'OPENID_CONNECT')[0];

    expect(oidc).toBeDefined();
    expect(oidc.openIDConnectConfig).toBeDefined();
    expect(oidc.openIDConnectConfig.issuer).toEqual('https://facebook.com/');
    expect(oidc.openIDConnectConfig.clientId).toEqual('clientId');
    expect(oidc.openIDConnectConfig.iatTTL).toEqual(1000);
    expect(oidc.openIDConnectConfig.authTTL).toEqual(2000);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
  });
});
