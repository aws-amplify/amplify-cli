/* eslint-disable */
import {
  addApi,
  addApiWithoutSchema,
  addFeatureFlag,
  amplifyPush,
  apiEnableDataStore,
  apiGqlCompile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  getTransformConfig,
  initJSProjectWithProfile,
  setCustomRolesConfig,
  updateApiSchema,
} from '@aws-amplify/amplify-e2e-core';
import { existsSync, readFileSync } from 'fs';
import _ from 'lodash';
import * as path from 'path';

const providerName = 'awscloudformation';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

describe('amplify add api (GraphQL)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('graphql-api');
  });

  afterEach(async () => {
    const metaFilePath = path.join(projRoot, 'amplify', '#current-cloud-backend', 'amplify-meta.json');
    if (existsSync(metaFilePath)) {
      await deleteProject(projRoot);
    }
    deleteProjectDir(projRoot);
  });

  it('init a datastore enabled project and then remove datastore config in update', async () => {
    const name = 'withoutdatastore';
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, name, 'simple_model.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const { output } = meta.api[name];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);

    // check project doesn't have datastore
    const withoutDSConfig = getTransformConfig(projRoot, name);
    expect(withoutDSConfig).toBeDefined();
    expect(_.isEmpty(withoutDSConfig.ResolverConfig)).toBe(true);

    // amplify update api to enable datastore
    await apiEnableDataStore(projRoot, {});
    const transformConfigWithDS = getTransformConfig(projRoot, name);
    expect(transformConfigWithDS).toBeDefined();
    expect(transformConfigWithDS.ResolverConfig).toBeDefined();
    expect(transformConfigWithDS.ResolverConfig.project).toBeDefined();
    expect(transformConfigWithDS.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');
    expect(transformConfigWithDS.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
  });

  it('init a project and add custom iam roles - local test with gql v2', async () => {
    const name = 'customadminroles';
    await initJSProjectWithProfile(projRoot, { name });
    await addApi(projRoot, { transformerVersion: 2, IAM: {}, 'Amazon Cognito User Pool': {} });
    updateApiSchema(projRoot, name, 'cognito_simple_model.graphql');
    await apiGqlCompile(projRoot);
    const createResolver = path.join(
      projRoot,
      'amplify',
      'backend',
      'api',
      name,
      'build',
      'resolvers',
      'Mutation.createTodo.auth.1.req.vtl',
    );
    const beforeAdminConfig = readFileSync(createResolver).toString();
    expect(beforeAdminConfig).toMatchSnapshot();

    const customRolesConfig = {
      adminRoleNames: ['myAdminRoleName'],
    };
    setCustomRolesConfig(projRoot, name, customRolesConfig);
    await apiGqlCompile(projRoot);
    const afterAdminConfig = readFileSync(createResolver).toString();
    expect(afterAdminConfig).toMatchSnapshot();
    expect(beforeAdminConfig).not.toEqual(afterAdminConfig);
  });

  it('init a project and add custom iam roles - local test with gql v2 w/ identity claim feature flag disabled', async () => {
    const name = 'customadminroles';
    await initJSProjectWithProfile(projRoot, { name });
    await addFeatureFlag(projRoot, 'graphqltransformer', 'useSubUsernameForDefaultIdentityClaim', false);
    await addApi(projRoot, { transformerVersion: 2, IAM: {}, 'Amazon Cognito User Pool': {} });
    updateApiSchema(projRoot, name, 'cognito_simple_model.graphql');
    await apiGqlCompile(projRoot);
    const createResolver = path.join(
      projRoot,
      'amplify',
      'backend',
      'api',
      name,
      'build',
      'resolvers',
      'Mutation.createTodo.auth.1.req.vtl',
    );
    const beforeAdminConfig = readFileSync(createResolver).toString();
    expect(beforeAdminConfig).toMatchSnapshot();

    const customRolesConfig = {
      adminRoleNames: ['myAdminRoleName'],
    };
    setCustomRolesConfig(projRoot, name, customRolesConfig);
    await apiGqlCompile(projRoot);
    const afterAdminConfig = readFileSync(createResolver).toString();
    expect(afterAdminConfig).toMatchSnapshot();
    expect(beforeAdminConfig).not.toEqual(afterAdminConfig);
  });

  // TODO: Disabling for now until further conversation.
  // it('inits a project with a simple model with deletion protection enabled and then migrates the api', async () => {
  //   const projectName = 'retaintables';
  //   const initialSchema = 'simple_model.graphql';
  //   console.log(projRoot);
  //   await initJSProjectWithProfile(projRoot, { name: projectName });
  //   await addApiWithSchema(projRoot, initialSchema);
  //   updateConfig(projRoot, projectName, {
  //     TransformerOptions: {
  //       '@model': { EnableDeletionProtection: true }
  //     }
  //   });
  //   await amplifyPush(projRoot);
  //   const projectMeta = getProjectMeta(projRoot);
  //   const region = projectMeta.providers.awscloudformation.Region;
  //   const { output } = projectMeta.api[projectName];
  //   const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
  //   await expect(GraphQLAPIIdOutput).toBeDefined()
  //   await expect(GraphQLAPIEndpointOutput).toBeDefined()
  //   await expect(GraphQLAPIKeyOutput).toBeDefined()
  //   await deleteProject(projRoot);
  //   const tableName = `Todo-${GraphQLAPIIdOutput}-integtest`;
  //   const table = await getTable(tableName, region);
  //   expect(table.Table).toBeDefined()
  //   if (table.Table) {
  //     const del = await deleteTable(tableName, region);
  //     expect(del.TableDescription).toBeDefined()
  //   }
  // });
});

/* eslint-enable */
