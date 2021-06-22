import {
  amplifyPush,
  amplifyPushUpdate,
  deleteProject,
  initJSProjectWithProfile,
  listAttachedRolePolicies,
  listRolePolicies,
  updateAuthAddAdminQueries,
} from 'amplify-e2e-core';
import * as path from 'path';
import { existsSync } from 'fs';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';
const providerName = 'awscloudformation';

import {
  addApiWithSchema,
  addApiWithSchemaAndConflictDetection,
  addRestApi,
  updateAPIWithResolutionStrategy,
  apiUpdateToggleDataStore,
  addFunction,
  addSimpleDDB,
  checkIfBucketExists,
  createNewProjectDir,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  getLocalEnvInfo,
  getTransformConfig,
  enableAdminUI,
} from 'amplify-e2e-core';
import { TRANSFORM_CURRENT_VERSION } from 'graphql-transformer-core';
import _ from 'lodash';

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
    await addApiWithSchemaAndConflictDetection(projRoot, 'key-conflict-detection.graphql');
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
    await addApiWithSchemaAndConflictDetection(projRoot, 'simple_model.graphql');

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
    await apiUpdateToggleDataStore(projRoot, {});
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

    await addApiWithSchemaAndConflictDetection(projRoot, 'simple_model.graphql');
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
    await addApiWithSchemaAndConflictDetection(projRoot, 'simple_model.graphql');

    let transformConfig = getTransformConfig(projRoot, name);
    expect(transformConfig).toBeDefined();
    expect(transformConfig.ResolverConfig).toBeDefined();
    expect(transformConfig.ResolverConfig.project).toBeDefined();
    expect(transformConfig.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
    expect(transformConfig.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');

    await updateAPIWithResolutionStrategy(projRoot, {});

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
    await addApiWithSchema(projRoot, 'simple_model.graphql');
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
    await apiUpdateToggleDataStore(projRoot, {});
    let transformConfigWithDS = getTransformConfig(projRoot, name);
    expect(transformConfigWithDS).toBeDefined();
    expect(transformConfigWithDS.ResolverConfig).toBeDefined();
    expect(transformConfigWithDS.ResolverConfig.project).toBeDefined();
    expect(transformConfigWithDS.ResolverConfig.project.ConflictHandler).toEqual('AUTOMERGE');
    expect(transformConfigWithDS.ResolverConfig.project.ConflictDetection).toEqual('VERSION');
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

describe('amplify add api (REST)', () => {
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir('rest-api');
  });

  afterEach(async () => {
    const meta = getProjectMeta(projRoot);
    expect(meta.providers.awscloudformation).toBeDefined();
    const {
      AuthRoleArn: authRoleArn,
      UnauthRoleArn: unauthRoleArn,
      DeploymentBucketName: bucketName,
      Region: region,
      StackId: stackId,
    } = meta.providers.awscloudformation;
    expect(authRoleArn).toBeDefined();
    expect(unauthRoleArn).toBeDefined();
    expect(region).toBeDefined();
    expect(stackId).toBeDefined();
    const bucketExists = await checkIfBucketExists(bucketName, region);
    expect(bucketExists).toMatchObject({});

    expect(meta.function).toBeDefined();
    let seenAtLeastOneFunc = false;
    for (let key of Object.keys(meta.function)) {
      const {
        service,
        build,
        lastBuildTimeStamp,
        lastPackageTimeStamp,
        distZipFilename,
        lastPushTimeStamp,
        lastPushDirHash,
      } = meta.function[key];
      expect(service).toBe('Lambda');
      expect(build).toBeTruthy();
      expect(lastBuildTimeStamp).toBeDefined();
      expect(lastPackageTimeStamp).toBeDefined();
      expect(distZipFilename).toBeDefined();
      expect(lastPushTimeStamp).toBeDefined();
      expect(lastPushDirHash).toBeDefined();
      seenAtLeastOneFunc = true;
    }
    expect(seenAtLeastOneFunc).toBeTruthy();

    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('init a project, add a DDB, then add a crud rest api', async () => {
    const randomId = await global.getRandomId();
    const DDB_NAME = `ddb${randomId}`;
    await initJSProjectWithProfile(projRoot, {});
    await addSimpleDDB(projRoot, { name: DDB_NAME });
    await addRestApi(projRoot, { isCrud: true });
    await amplifyPushUpdate(projRoot);

    const meta = getProjectMeta(projRoot);
    expect(meta.storage[DDB_NAME]).toBeDefined();
    const { service, lastPushTimeStamp, lastPushDirHash } = meta.storage[DDB_NAME];
    expect(service).toBe('DynamoDB');
    expect(lastPushTimeStamp).toBeDefined();
    expect(lastPushDirHash).toBeDefined();
  });

  it('init a project, then add a serverless rest api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addRestApi(projRoot, { isCrud: false });
    await amplifyPushUpdate(projRoot);
  });

  it('init a project, create lambda and attach it to an api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await amplifyPushUpdate(projRoot);
  });

  it('init a project, create lambda and attach multiple rest apis', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, {
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: true,
    });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: true,
    });
    await addRestApi(projRoot, {
      isFirstRestApi: false,
      existingLambda: true,
      restrictAccess: true,
      allowGuestUsers: false,
    });
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true });
    await updateAuthAddAdminQueries(projRoot);
    await amplifyPushUpdate(projRoot);

    const amplifyMeta = getProjectMeta(projRoot);
    const meta = amplifyMeta.providers.awscloudformation;
    const { AuthRoleName, UnauthRoleName, Region } = meta;

    expect(await listRolePolicies(AuthRoleName, Region)).toEqual([]);
    expect(await listRolePolicies(UnauthRoleName, Region)).toEqual([]);

    const authPolicies = await listAttachedRolePolicies(AuthRoleName, Region);
    expect(authPolicies.length).toBeGreaterThan(0);

    for (let i = 0; i < authPolicies.length; i++) {
      expect(authPolicies[i].PolicyName).toMatch(/PolicyAPIGWAuth\d/);
    }

    const unauthPolicies = await listAttachedRolePolicies(UnauthRoleName, Region);
    expect(unauthPolicies.length).toBeGreaterThan(0);

    for (let i = 0; i < unauthPolicies.length; i++) {
      expect(unauthPolicies[i].PolicyName).toMatch(/PolicyAPIGWUnauth\d/);
    }
  });

  it('adds a rest api and then adds a path to the existing api', async () => {
    await initJSProjectWithProfile(projRoot, {});
    await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
    await addRestApi(projRoot, { existingLambda: true });
    await addRestApi(projRoot, { isFirstRestApi: false, existingLambda: true, path: '/newpath' });
    await amplifyPushUpdate(projRoot);
  });
});
