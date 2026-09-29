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

  it('lambda auth must fail when missing read access on a field or invalid token', async () => {
    const envName = 'devtest';
    const projName = 'lambdaauthmodeerr';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithAllAuthModes(projRoot);
    await updateApiSchema(projRoot, projName, 'lambda-auth-field-auth-1-v2.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.lambdaauthmodeerr;
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
        }
      }
    `;
    const createInput = {
      input: {
        noteId: '1',
        note: 'initial note',
      },
    };
    await appSyncClient.mutate({
      mutation: gql(createMutation),
      fetchPolicy: 'no-cache',
      variables: createInput,
    });

    const listNotesQuery = /* GraphQL */ `
      query ListNotes {
        listNotes {
          items {
            noteId
            note
          }
        }
      }
    `;

    await expect(
      appSyncClient.query({
        query: gql(listNotesQuery),
        fetchPolicy: 'no-cache',
      }),
    ).rejects.toThrow(`GraphQL error: Not Authorized to access note on type`);

    const appSyncInvalidClient = new AWSAppSyncClient({
      url,
      region,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.AWS_LAMBDA,
        token: 'invalid-token',
      },
    });

    await expect(
      appSyncInvalidClient.query({
        query: gql(listNotesQuery),
        fetchPolicy: 'no-cache',
      }),
    ).rejects.toThrow(`Network error: Response not successful: Received status code 401`);
  });

  it('lambda auth with no create access', async () => {
    const envName = 'devtest';
    const projName = 'lambdaauth2';
    await initJSProjectWithProfile(projRoot, { name: projName, envName });
    await addApiWithAllAuthModes(projRoot);
    await updateApiSchema(projRoot, projName, 'lambda-auth-field-auth-2-v2.graphql');
    await amplifyPush(projRoot);

    const meta = getProjectMeta(projRoot);
    const region = meta.providers.awscloudformation.Region;
    const { output } = meta.api.lambdaauth2;
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

    await expect(
      appSyncClient.mutate({
        mutation: gql(createMutation),
        fetchPolicy: 'no-cache',
        variables: createInput,
      }),
    ).rejects.toThrow(`GraphQL error: Unauthorized on [note]`);
  });
});
