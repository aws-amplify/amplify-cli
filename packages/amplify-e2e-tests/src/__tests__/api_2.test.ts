import { JSONUtilities } from 'amplify-cli-core';
import {
  addApi,
  addApiWithBlankSchemaAndConflictDetection,
  addApiWithoutSchema,
  amplifyPush,
  amplifyPushUpdate,
  apiDisableDataStore,
  apiEnableDataStore,
  apiGqlCompile,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  enableAdminUI,
  getAppSyncApi,
  getLocalEnvInfo,
  getProjectMeta,
  getTransformConfig,
  initJSProjectWithProfile,
  updateApiSchema,
  updateAPIWithResolutionStrategyWithModels,
  setCustomRolesConfig,
} from 'amplify-e2e-core';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { existsSync, readFileSync } from 'fs';
import gql from 'graphql-tag';
import { TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
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

  it('init a project with conflict detection enabled and a schema with @key, test update mutation', async () => {
    const name = `keyconflictdetection`;
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, name, 'key-conflict-detection.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta['providers'][providerName]['Region'] as string;
    const { output } = meta.api[name];
    const url = output.GraphQLAPIEndpointOutput as string;
    const apiKey = output.GraphQLAPIKeyOutput as string;

    const appSyncClient = new AWSAppSyncClient({
      url,
      region,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.API_KEY,
        apiKey,
      },
    });

    const createMutation = /* GraphQL */ `
      mutation CreateNote($input: CreateNoteInput!, $condition: ModelNoteConditionInput) {
        createNote(input: $input, condition: $condition) {
          noteId
          note
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }
    `;
    const createInput = {
      input: {
        noteId: '1',
        note: 'initial note',
      },
    };
    const createResult: any = await appSyncClient.mutate({
      mutation: gql(createMutation),
      fetchPolicy: 'no-cache',
      variables: createInput,
    });

    const updateMutation = /* GraphQL */ `
      mutation UpdateNote($input: UpdateNoteInput!, $condition: ModelNoteConditionInput) {
        updateNote(input: $input, condition: $condition) {
          noteId
          note
          _version
          _deleted
          _lastChangedAt
          createdAt
          updatedAt
        }
      }
    `;
    const createResultData = createResult.data as any;
    const updateInput = {
      input: {
        noteId: createResultData.createNote.noteId,
        note: 'note updated',
        _version: createResultData.createNote._version,
      },
    };

    const updateResult: any = await appSyncClient.mutate({
      mutation: gql(updateMutation),
      fetchPolicy: 'no-cache',
      variables: updateInput,
    });
    const updateResultData = updateResult.data as any;

    expect(updateResultData).toBeDefined();
    expect(updateResultData.updateNote).toBeDefined();
    expect(updateResultData.updateNote.noteId).toEqual(createResultData.createNote.noteId);
    expect(updateResultData.updateNote.note).not.toEqual(createResultData.createNote.note);
    expect(updateResultData.updateNote._version).not.toEqual(createResultData.createNote._version);
    expect(updateResultData.updateNote.note).toEqual(updateInput.input.note);
  });

  it('init a project with conflict detection enabled and toggle disable', async () => {
    const name = `conflictdetection`;
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 1 });
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

    const transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');

    // remove datastore feature
    await apiDisableDataStore(projRoot, {});
    await amplifyPushUpdate(projRoot);
    const disableDSConfig = getTransformConfig(projRoot, name);
    expect(disableDSConfig).toBeDefined();
    expect(_.isEmpty(disableDSConfig.ResolverConfig)).toBe(true);
  });

  it('init a project with conflict detection enabled and admin UI enabled to generate datastore models in the cloud', async () => {
    const name = `dsadminui`;
    await initJSProjectWithProfile(projRoot, { disableAmplifyAppCreation: false, name });

    let meta = getProjectMeta(projRoot);
    const appId = meta.providers?.[providerName]?.AmplifyAppId;
    const region = meta.providers?.[providerName]?.Region;

    expect(appId).toBeDefined();

    const localEnvInfo = getLocalEnvInfo(projRoot);
    const envName = localEnvInfo.envName;

    // setupAdminUI
    await enableAdminUI(appId, envName, region);

    await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, name, 'simple_model.graphql');
    await amplifyPush(projRoot);

    meta = getProjectMeta(projRoot);

    const { output } = meta.api[name];
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, meta.providers.awscloudformation.Region);

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
  });

  it('init a sync enabled project and update conflict resolution strategy', async () => {
    const name = `syncenabled`;
    await initJSProjectWithProfile(projRoot, { name });
    await addApiWithBlankSchemaAndConflictDetection(projRoot, { transformerVersion: 1 });
    await updateApiSchema(projRoot, name, 'simple_model.graphql');

    let transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');

    await updateAPIWithResolutionStrategyWithModels(projRoot, {});

    transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.Version).toBeDefined();
    expect(transformConfig.Version).toEqual(TRANSFORM_CURRENT_VERSION);
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('OPTIMISTIC_CONCURRENCY');

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
    let transformConfigWithDS = getTransformConfig(projRoot, name);
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
