/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */

import {
  amplifyPushLegacy,
  amplifyPushUpdate,
  cliInputsExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  updateApiSchema,
  updateApiWithMultiAuth,
  initJSProjectWithProfile
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { join } from 'path';
import { addApiWithoutSchemaOldDx } from '../../../migration-helpers';

describe('api migration update test b', () => {
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

  // This test is the same as the one above except the api is NOT migrated on update.
  // This checks that new versions of the CLI can still update non-migrated APIs
  it('allows api updates without api migration', async () => {
    // init and add api with installed CLI
    await initJSProjectWithProfile(projRoot, {
      name: 'simplemodelmultiauth',
      includeUsageDataPrompt: false
    });
    await addApiWithoutSchemaOldDx(projRoot);
    await updateApiSchema(projRoot, 'simplemodelmultiauth', 'simple_model.graphql');
    await amplifyPushLegacy(projRoot);
    // update and push with codebase
    await updateApiWithMultiAuth(projRoot, { testingWithLatestCodebase: true, doMigrate: false });
    // cli-inputs should not exist
    expect(cliInputsExists(projRoot, 'api', 'simplemodelmultiauth')).toBe(false);
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
