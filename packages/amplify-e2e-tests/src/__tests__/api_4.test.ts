import {
  addApiWithSchema,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  getSchemaPath,
  initJSProjectWithProfile,
} from 'amplify-e2e-core';
import AWSAppSyncClient, { AUTH_TYPE } from 'aws-appsync';
import gql from 'graphql-tag';
(global as any).fetch = require('node-fetch');

describe('multi-key GSI behavior', () => {
  const projName = 'multikey';

  const firstName = 'John';
  const lastName = 'Doe';
  const age = 23;
  const birthDate = '1998-03-02';
  const nickname = 'Johnny';
  const height = 72;
  const eyeColor = 'purple'; // he's a special boy

  const getPersonByNameAndAge = 'getPersonByNameAndAge';
  const getPersonByNicknameAndHeight = 'getPersonByNicknameAndHeight';

  let appSyncClient: AWSAppSyncClient<any>;
  let projRoot: string;
  beforeEach(async () => {
    projRoot = await createNewProjectDir(projName);
    await initJSProjectWithProfile(projRoot, { name: projName });
    await addApiWithSchema(projRoot, 'multi-gsi.graphql');
    await amplifyPush(projRoot);

    appSyncClient = getAppSyncClientFromProj(projRoot);
  });
  afterEach(async () => {
    await deleteProject(projRoot);
    deleteProjectDir(projRoot);
  });

  it('does not include record in GSI when create mutation does not specify GSI fields', async () => {
    const createMutation = /* GraphQL */ `
      mutation CreatePerson {
        createPerson(input: {
          firstName: "${firstName}",
          lastName: "${lastName}"
        }) {
          id
        }
      }

    `;

    const createResult = await appSyncClient.mutate({
      mutation: gql(createMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createResult.errors).toBeUndefined();
    expect(createResult.data).toBeDefined();

    await verifyGetPersonByNameAndAge(firstName, 0);
    await verifyGetPersonByNicknameAndHeight(firstName, 0);
  });

  it('only includes record in specified GSI when multiple keys in schema but create mutation only includes one', async () => {
    const createMutation = /* GraphQL */ `
      mutation CreatePerson {
        createPerson(input: {
          firstName: "${firstName}",
          lastName: "${lastName}",
          age: ${age},
          birthDate: "${birthDate}",
        }) {
          id
        }
      }
    `;

    const createResult = await appSyncClient.mutate({
      mutation: gql(createMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createResult.errors).toBeUndefined();
    expect(createResult.data).toBeDefined();

    // check that specified GSI is included in results
    await verifyGetPersonByNameAndAge(firstName, 1, { age, birthDate });

    // check that unspecified GSI is not included
    await verifyGetPersonByNicknameAndHeight(firstName, 0);
  });

  it('does not modify GSI when update mutation does not include GSI fields', async () => {
    const createMutation = /* GraphQL */ `
      mutation CreatePerson {
        createPerson(input: {
          firstName: "${firstName}",
          lastName: "${lastName}",
          age: ${age},
          birthDate: "${birthDate}",
        }) {
          id
        }
      }
    `;

    const createResult: any = await appSyncClient.mutate({
      mutation: gql(createMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createResult.errors).toBeUndefined();

    const id = createResult?.data?.createPerson?.id;
    expect(id).toBeDefined();

    // record should be included in GSI
    await verifyGetPersonByNameAndAge(firstName, 1, { age, birthDate });

    const updateMutation = /* GraphQL */ `
      mutation UpdatePerson {
        updatePerson(input: {
          id: "${id}",
          firstName: "${firstName}",
          lastName: "${lastName}",
          eyeColor: "${eyeColor}",
        }) {
          id
        }
      }
    `;

    const updateResult = await appSyncClient.mutate({
      mutation: gql(updateMutation),
      fetchPolicy: 'no-cache',
    });

    expect(updateResult.errors).toBeUndefined();

    // GSI fields should be unmodified
    await verifyGetPersonByNameAndAge(firstName, 1, { age, birthDate });
  });

  it('only modifies specified GSI when multiple keys in schema but update mutation only includes one', async () => {
    const createMutation = /* GraphQL */ `
    mutation CreatePerson {
      createPerson(input: {
        firstName: "${firstName}",
        lastName: "${lastName}",
        age: ${age},
        birthDate: "${birthDate}",
        nickname: "${nickname}",
        height: ${height},
      }) {
        id
      }
    }
  `;

    const createResult: any = await appSyncClient.mutate({
      mutation: gql(createMutation),
      fetchPolicy: 'no-cache',
    });

    expect(createResult.errors).toBeUndefined();

    const id = createResult?.data?.createPerson?.id;
    expect(id).toBeDefined();

    // record should be in both GSIs
    await verifyGetPersonByNameAndAge(firstName, 1, { age, birthDate });
    await verifyGetPersonByNicknameAndHeight(firstName, 1, { nickname, height });

    const newNickname = 'Jon-jon';
    const newHeight = 71;

    const updateMutation = /* GraphQL */ `
      mutation UpdatePerson {
        updatePerson(input: {
          id: "${id}",
          firstName: "${firstName}",
          lastName: "${lastName}",
          nickname: "${newNickname}",
          height: ${newHeight},
        }) {
          id
        }
      }
    `;

    const updateResult = await appSyncClient.mutate({
      mutation: gql(updateMutation),
      fetchPolicy: 'no-cache',
    });

    expect(updateResult.errors).toBeUndefined();

    // record should still be in both GSIs with updated values in one
    await verifyGetPersonByNameAndAge(firstName, 1, { age, birthDate });
    await verifyGetPersonByNicknameAndHeight(firstName, 1, { nickname: newNickname, height: newHeight });
  });

  const getAppSyncClientFromProj = (projRoot: string) => {
    const meta = getProjectMeta(projRoot);
    const region = meta['providers']['awscloudformation']['Region'] as string;
    const { output } = meta.api[projName];
    const url = output.GraphQLAPIEndpointOutput as string;
    const apiKey = output.GraphQLAPIKeyOutput as string;

    return new AWSAppSyncClient({
      url,
      region,
      disableOffline: true,
      auth: {
        type: AUTH_TYPE.API_KEY,
        apiKey,
      },
    });
  };

  // helper functions that query GSIs and assert the expected number of results were returned

  const verifyGetPersonByNameAndAge = async (firstName: string, expectedCount: number, beginsWith?: { age: number; birthDate: string }) => {
    const query = beginsWith
      ? /* GraphQL */ `
        query GetPersonByNameAndAge($firstName: String, $beginsWith: ModelPersonByNameAndAgeCompositeKeyInput) {
          ${getPersonByNameAndAge}(
            firstName: $firstName,
            ageBirthDate: {
              beginsWith: $beginsWith
            }) {
            nextToken
            items {
              id
            }
          }
        }
      `
      : /* GraphQL */ `
        query GetPersonByNameAndAge($firstName: String) {
          ${getPersonByNameAndAge}(firstName: $firstName) {
            nextToken
            items {
              id
            }
          }
        }
      `;

    const queryInput = {
      firstName,
      beginsWith,
    };

    const queryResult = await appSyncClient.query({
      query: gql(query),
      fetchPolicy: 'no-cache',
      variables: queryInput,
    });

    expect(queryResult?.data?.[getPersonByNameAndAge]?.items?.length).toBe(expectedCount);
    expect(queryResult?.data?.[getPersonByNameAndAge]?.nextToken).toBeNull();
    expect(queryResult?.errors).toBeUndefined();
  };

  const verifyGetPersonByNicknameAndHeight = async (
    firstName: string,
    expectedCount: number,
    beginsWith?: { nickname: string; height: number },
  ) => {
    const query = beginsWith
      ? /* GraphQL */ `
      query GetPersonByNicknameAndHeight($firstName: String, $beginsWith: ModelPersonByNicknameAndHeightCompositeKeyInput) {
        ${getPersonByNicknameAndHeight}(
          firstName: $firstName,
          nicknameHeight: {
            beginsWith: $beginsWith
          }) {
          nextToken
          items {
            id
          }
        }
      }
    `
      : /* GraphQL */ `
      query GetPersonByNicknameAndHeight($firstName: String) {
        ${getPersonByNicknameAndHeight}(firstName: $firstName) {
          nextToken
          items {
            id
          }
        }
      }
    `;

    const queryInput = {
      firstName,
      beginsWith,
    };

    const queryResult = await appSyncClient.query({
      query: gql(query),
      fetchPolicy: 'no-cache',
      variables: queryInput,
    });

    expect(queryResult?.data?.[getPersonByNicknameAndHeight]?.items?.length).toBe(expectedCount);
    expect(queryResult?.data?.[getPersonByNicknameAndHeight]?.nextToken).toBeNull();
    expect(queryResult?.errors).toBeUndefined();
  };
});
