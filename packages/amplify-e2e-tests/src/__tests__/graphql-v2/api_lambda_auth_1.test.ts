import {
  checkIfBucketExists,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getAppSyncApi,
  getProjectMeta,
  initJSProjectWithProfile,
  updateApiSchema,
  addApiWithAllAuthModes,
  amplifyPush,
} from '@aws-amplify/amplify-e2e-core';
import gql from 'graphql-tag';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import { addEnvironment, checkoutEnvironment, listEnvironment } from '../../environment/env';

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

describe('amplify add api (GraphQL) - Lambda Authorizer', () => {
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
    for (const key of Object.keys(meta.function)) {
      const { service, build, lastBuildTimeStamp, lastPackageTimeStamp, distZipFilename, lastPushTimeStamp, lastPushDirHash } =
        meta.function[key];
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

  it('init a project and add the api with lambda auth multiple env', async () => {
    const envName = 'devtest';
    const projName = 'lambdaauthenv';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithAllAuthModes(projRoot);
    await updateApiSchema(projRoot, projName, 'lambda-auth-field-auth-v2.graphql');
    await amplifyPush(projRoot);

    let meta = getProjectMeta(projRoot);
    let region = meta.providers.awscloudformation.Region;
    let { output } = meta.api[projName];
    let { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    let { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);

    await addEnvironment(projRoot, { envName: 'testenv' });
    await listEnvironment(projRoot, { numEnv: 2 });
    await checkoutEnvironment(projRoot, { envName: 'testenv' });
    await amplifyPush(projRoot);

    meta = getProjectMeta(projRoot);
    region = meta.providers.awscloudformation.Region;
    output = meta.api[projName].output;
    GraphQLAPIIdOutput = output.GraphQLAPIIdOutput;
    GraphQLAPIEndpointOutput = output.GraphQLAPIEndpointOutput;
    GraphQLAPIKeyOutput = output.GraphQLAPIKeyOutput;
    graphqlApi = (await getAppSyncApi(GraphQLAPIIdOutput, region)).graphqlApi;

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);
  });

  it('init a project and add the simple_model api include lambda auth', async () => {
    const envName = 'devtest';
    const projName = 'lambdaauthmode';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithAllAuthModes(projRoot);
    await updateApiSchema(projRoot, projName, 'lambda-auth-field-auth-v2.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.lambdaauthmode;
    const { GraphQLAPIIdOutput, GraphQLAPIEndpointOutput, GraphQLAPIKeyOutput } = output;
    const { graphqlApi } = await getAppSyncApi(GraphQLAPIIdOutput, region);

    expect(GraphQLAPIIdOutput).toBeDefined();
    expect(GraphQLAPIEndpointOutput).toBeDefined();
    expect(GraphQLAPIKeyOutput).toBeDefined();

    expect(graphqlApi).toBeDefined();
    expect(graphqlApi.apiId).toEqual(GraphQLAPIIdOutput);

    const url = GraphQLAPIEndpointOutput as string;

    const appSyncClient = new AWSAppSyncClient({
      url,
      region,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AWS_LAMBDA,
        token: 'custom-authorized',
      },
    });

    const createMutation = /* GraphQL */ `
      mutation CreateNote($input: CreateNoteInput!, $condition: ModelNoteConditionInput) {
        createNote(input: $input, condition: $condition) {
          noteId
          note
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
    expect(updateResultData.updateNote.note).toEqual(updateInput.input.note);
  });
});
