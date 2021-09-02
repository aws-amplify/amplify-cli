import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { cleanupStackAfterTest, deploy } from '../deployNestedStacks';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { default as moment } from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });
const featureFlags = {
  getBoolean: jest.fn().mockImplementation((name, defaultValue) => {
    if (name === 'improvePluralization') {
      return true;
    }
    return;
  }),
  getNumber: jest.fn(),
  getObject: jest.fn(),
  getString: jest.fn(),
};
const BUILD_TIMESTAMP = moment().format('YYYYMMDDHHmmss');
const STACK_NAME = `ModelConnectionKeyTransformerTest-${BUILD_TIMESTAMP}`;
const BUCKET_NAME = `appsync-connection-key-transformer-test-${BUILD_TIMESTAMP}`;
const LOCAL_FS_BUILD_DIR = '/tmp/model_connection_key_transform_tests/';
const S3_ROOT_DIR_KEY = 'deployments';

let GRAPHQL_CLIENT = undefined;

function outputValueSelector(key: string) {
  return (outputs: Output[]) => {
    const output = outputs.find((o: Output) => o.OutputKey === key);
    return output ? output.OutputValue : null;
  };
}

beforeAll(async () => {
  const validSchema = `
    type AProject
    @model(subscriptions: null)
    @key(fields: ["projectId"])
    {
        projectId: String!
        name: String
        team: ATeam @connection
    }

    type ATeam
    @model(subscriptions: null)
    @key(fields: ["teamId"])
    {
        teamId: String!
        name: String
    }

    type BProject
    @model(subscriptions: null)
    @key(fields: ["projectId"])
    {
        projectId: String!
        name: String
        teams: [BTeam] @connection
    }

    type BTeam
    @model(subscriptions: null)
    @key(fields: ["teamId"])
    {
        teamId: String!
        name: String
    }

    type CProject
    @model(subscriptions: null)
    @key(fields: ["projectId"])
    {
        projectId: ID!
        name: String
        team: CTeam @connection(name: "CProjectCTeam")
    }

    type CTeam
    @model(subscriptions: null)
    @key(fields: ["teamId"])
    {
        teamId: ID!
        name: String
        project: CProject @connection(name: "CProjectCTeam")
    }

    type DProject
    @model(subscriptions: null)
    @key(fields: ["projectId"])
    {
        projectId: ID!
        name: String
        teams: [DTeam] @connection(name: "DProjectDTeam")
    }

    type DTeam
    @model(subscriptions: null)
    @key(fields: ["teamId"])
    {
        teamId: ID!
        name: String
        project: DProject @connection(name: "DProjectDTeam")
    }

    type Model1
    @model(subscriptions: null)
    @key(fields: ["id", "sort"])
    @key(name: "byName", fields: ["name", "id"])
    @key(name: "byNameIdAndSort", fields: ["name","id","sort"])
    {
        id: ID!
        sort: Int!
        name: String!
    }
    type Model2 @model(subscriptions: null)
    {
        id: ID!
        connection: Model1 @connection(sortField: "modelOneSort")
        modelOneSort: Int
    }

    type Model3 @model(subscriptions: null)
    {
      id: ID!
      connectionPK: ID
      connectionSort: Int
      connectionSK: String
      connectionName: String
      connection: Model1 @connection(keyField:"connectionPK", sortField: "connectionSort")
      connections: [Model1] @connection(keyName: "byName", fields: ["connectionSK"])
      connectionsWithCompositeKey: [Model4]
      @connection(
        keyName: "byNameIdAndSort"
        fields: ["connectionName", "connectionPK", "connectionSort"])
    }

    type Model4 @model(subscriptions: null) @key(name: "byNameIdAndSort", fields: ["name", "id", "sort"])
    {
      id: ID!
      sort: Int!
      name: String!
    }
    `;

  const transformer = new GraphQLTransform({
    featureFlags,
    transformers: [
      new DynamoDBModelTransformer(),
      new KeyTransformer(),
      new ModelConnectionTransformer(),
      new ModelAuthTransformer({
        authConfig: {
          defaultAuthentication: {
            authenticationType: 'API_KEY',
          },
          additionalAuthenticationProviders: [],
        },
      }),
    ],
  });
  const out = transformer.transform(validSchema);

  try {
    await awsS3Client
      .createBucket({
        Bucket: BUCKET_NAME,
      })
      .promise();
  } catch (e) {
    console.error(`Failed to create S3 bucket: ${e}`);
  }
  try {
    const finishedStack = await deploy(
      customS3Client,
      cf,
      STACK_NAME,
      out,
      { CreateAPIKey: '1' },
      LOCAL_FS_BUILD_DIR,
      BUCKET_NAME,
      S3_ROOT_DIR_KEY,
      BUILD_TIMESTAMP,
    );

    // Arbitrary wait to make sure everything is ready.
    await cf.wait(5, () => Promise.resolve());
    expect(finishedStack).toBeDefined();
    const getApiEndpoint = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIEndpointOutput);
    const getApiKey = outputValueSelector(ResourceConstants.OUTPUTS.GraphQLAPIApiKeyOutput);
    const endpoint = getApiEndpoint(finishedStack.Outputs);
    const apiKey = getApiKey(finishedStack.Outputs);
    expect(apiKey).toBeDefined();
    expect(endpoint).toBeDefined();
    GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

afterAll(async () => {
  await cleanupStackAfterTest(BUCKET_NAME, STACK_NAME, cf);
});

/**
 * Test queries below
 */

test('Unnamed connection 1 way navigation, with primary @key directive 1:1', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation CreateATeam {
        createATeam(input: {teamId: "T1", name: "Team 1"}) {
            teamId
            name
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation CreateAProject {
        createAProject(input: {projectId: "P1", name: "P1", aProjectTeamId: "T1"}) {
            projectId
            name
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query ListAProjects {
        listAProjects {
            items {
                projectId
                name
                team {
                    teamId
                    name
                }
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.listAProjects).toBeDefined();
  const items = queryResponse.data.listAProjects.items;
  expect(items.length).toEqual(1);
  expect(items[0].projectId).toEqual('P1');
  expect(items[0].team).toBeDefined();
  expect(items[0].team.teamId).toEqual('T1');
});

test('Unnamed connection 1 way navigation, with primary @key directive 1:M', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation CreateBProject {
        createBProject(input: {projectId: "P1", name: "P1"}) {
            projectId
            name
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation CreateBTeam {
        createBTeam(input: {teamId: "T1", name: "Team 1", bProjectTeamsId: "P1"}) {
            teamId
            name
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation CreateBTeam {
        createBTeam(input: {teamId: "T2", name: "Team 2", bProjectTeamsId: "P1"}) {
            teamId
            name
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query ListBProjects {
        listBProjects {
            items {
                projectId
                name
                teams {
                    items {
                        teamId
                        name
                    }
                }
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.listBProjects).toBeDefined();
  const items = queryResponse.data.listBProjects.items;
  expect(items.length).toEqual(1);
  expect(items[0].projectId).toEqual('P1');
  expect(items[0].teams).toBeDefined();
  expect(items[0].teams.items).toBeDefined();
  expect(items[0].teams.items.length).toEqual(2);
  expect(items[0].teams.items[0].teamId).toEqual('T1');
  expect(items[0].teams.items[1].teamId).toEqual('T2');
});

test('Named connection 2 way navigation, with with custom @key fields 1:1', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation CreateCTeam {
        createCTeam(input: {teamId: "T1", name: "Team 1", cTeamProjectId: "P1"}) {
            teamId
            name
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation CreateCProject {
        createCProject(input: {projectId: "P1", name: "P1", cProjectTeamId: "T1"}) {
            projectId
            name
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query ListCProjects {
        listCProjects {
            items {
                projectId
                name
                team {
                    teamId
                    name
                    project {
                        projectId
                        name
                    }
                }
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.listCProjects).toBeDefined();
  const items = queryResponse.data.listCProjects.items;
  expect(items.length).toEqual(1);
  expect(items[0].projectId).toEqual('P1');
  expect(items[0].team).toBeDefined();
  expect(items[0].team.teamId).toEqual('T1');
  expect(items[0].team.project).toBeDefined();
  expect(items[0].team.project.projectId).toEqual('P1');
});

test('Named connection 2 way navigation, with with custom @key fields 1:M', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation CreateDProject {
        createDProject(input: {projectId: "P1", name: "P1"}) {
            projectId
            name
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation CreateDTeam {
        createDTeam(input: {teamId: "T1", name: "Team 1", dTeamProjectId: "P1"}) {
            teamId
            name
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation CreateDTeam {
        createDTeam(input: {teamId: "T2", name: "Team 2", dTeamProjectId: "P1"}) {
            teamId
            name
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query ListDProjects {
        listDProjects {
            items {
                projectId
                name
                teams {
                    items {
                        teamId
                        name
                        project {
                            projectId
                            name
                        }
                    }
                }
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.listDProjects).toBeDefined();
  const items = queryResponse.data.listDProjects.items;
  expect(items.length).toEqual(1);
  expect(items[0].projectId).toEqual('P1');
  expect(items[0].teams).toBeDefined();
  expect(items[0].teams.items).toBeDefined();
  expect(items[0].teams.items.length).toEqual(2);
  expect(items[0].teams.items[0].teamId).toEqual('T1');
  expect(items[0].teams.items[0].project).toBeDefined();
  expect(items[0].teams.items[0].project.projectId).toEqual('P1');
  expect(items[0].teams.items[1].teamId).toEqual('T2');
  expect(items[0].teams.items[1].project).toBeDefined();
  expect(items[0].teams.items[1].project.projectId).toEqual('P1');
});

test('Unnamed connection with sortField parameter only #2100', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation M11 {
        createModel1(input: {id: "M11", sort: 10, name: "M1-1"}) {
            id
            name
            sort
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation M12 {
        createModel1(input: {id: "M12", sort: 10, name: "M1-2"}) {
            id
            name
            sort
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation M21 {
        createModel2(input: {id: "M21", modelOneSort: 10, model2ConnectionId: "M11"}) {
            id
            modelOneSort
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query Query {
        getModel2(id: "M21") {
            id
            connection {
                id
                sort
                name
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.getModel2).toBeDefined();
  const item = queryResponse.data.getModel2;
  expect(item.id).toEqual('M21');
  expect(item.connection).toBeDefined();
  expect(item.connection.id).toEqual('M11');
  expect(item.connection.sort).toEqual(10);
});

test('Connection with null sort key returns null when getting a single item', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation M11 {
        createModel1(input: {id: "Null-M11", sort: 10, name: "M1-1"}) {
            id
            name
            sort
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation M21 {
        createModel2(input: {id: "Null-M21", model2ConnectionId: "Null-M11"}) {
            id
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation M31 {
        createModel3(input: {id: "Null-M31", connectionPK: "Null-M11"}) {
            id
            connectionPK
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query Query {
        getModel2(id: "Null-M21") {
            id
            connection {
                id
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.getModel2).toBeDefined();
  const item = queryResponse.data.getModel2;
  expect(item.id).toEqual('Null-M21');
  expect(item.connection).toEqual(null);

  const queryResponse2 = await GRAPHQL_CLIENT.query(
    `
    query Query {
        getModel3(id: "Null-M31") {
            id
            connection {
                id
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse2.data.getModel3).toBeDefined();
  const item2 = queryResponse2.data.getModel3;
  expect(item2.id).toEqual('Null-M31');
  expect(item2.connection).toEqual(null);
});

test('Connection with null partition key returns null when getting a list of items', async () => {
  await GRAPHQL_CLIENT.query(
    `
    mutation M11 {
        createModel1(input: {id: "Null-List-M11", sort: 909, name: "Null-List-M1-1"}) {
            id
            name
            sort
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation M31 {
        createModel3(input: {id: "Null-List-M31", connectionSort: 909, connectionSK: "Null-List-M1-1"}) {
            id
            connectionSK
        }
    }
    `,
    {},
  );

  await GRAPHQL_CLIENT.query(
    `
    mutation M32 {
        createModel3(input: {id: "Null-List-M32", connectionPK: "Null-List-M11"}) {
            id
            connectionPK
        }
    }
    `,
    {},
  );

  const queryResponse = await GRAPHQL_CLIENT.query(
    `
    query Query {
        getModel3(id: "Null-List-M32") {
            id
            connections {
              items {
                id
              }
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse.data.getModel3).toBeDefined();
  const item = queryResponse.data.getModel3;
  expect(item.id).toEqual('Null-List-M32');
  expect(item.connections.items.length).toEqual(0);

  const queryResponse2 = await GRAPHQL_CLIENT.query(
    `
    query Query {
        getModel3(id: "Null-List-M31") {
            id
            connections {
              items {
                id
                name
              }
            }
        }
    }
    `,
    {},
  );
  expect(queryResponse2.data.getModel3).toBeDefined();
  const item2 = queryResponse2.data.getModel3;
  expect(item2.id).toEqual('Null-List-M31');
  expect(item2.connections.items.length).toEqual(1);
  expect(item2.connections.items[0].id).toEqual('Null-List-M11');
});

test('Connection with null key attributes returns empty array', async () => {
  // https://github.com/aws-amplify/amplify-cli/pull/5153#pullrequestreview-506028382
  const mutationResponse = await GRAPHQL_CLIENT.query(
    `
    mutation createModel3WithMissingPKConnectionField {
      createModel3(input: {id: "Null-Connection-PK-M34", connectionSort: 909, connectionPK: "unused-pk"}) {
        connectionsWithCompositeKey {
          items {
            id
            name
            sort
          }
        }
      }
    }
    `,
    {},
  );

  expect(mutationResponse.data.createModel3).toBeDefined();
  const item = mutationResponse.data.createModel3;
  expect(item.connectionsWithCompositeKey.items.length).toEqual(0);
  expect(mutationResponse.errors).not.toBeDefined();

  const mutationResponse2 = await GRAPHQL_CLIENT.query(
    `
    mutation createModel4 {
      createModel4(input: {id: "1", sort: 1, name: "model4Name"}) {
        id
      }
    }
    `,
    {},
  );

  const mutationResponse3 = await GRAPHQL_CLIENT.query(
    `
    mutation createModel3WithMissingSortConnectionField {
      createModel3(input: {id: "Null-Connection-PK-M34-3", connectionSort: 1, connectionName: "model4Name"}) {
        connectionsWithCompositeKey {
          items {
            id
            name
            sort
          }
        }
      }
    }
    `,
    {},
  );

  expect(mutationResponse3.data.createModel3).toBeDefined();
  const item3 = mutationResponse3.data.createModel3;
  expect(item3.connectionsWithCompositeKey.items.length).toEqual(0);
  expect(mutationResponse3.errors).not.toBeDefined();

  const mutationResponse4 = await GRAPHQL_CLIENT.query(
    `
    mutation createModel3WithAllConnectionFields {
      createModel3(input: {id: "Null-Connection-PK-M34-4", connectionSort: 1, connectionName: "model4Name", connectionPK: "1"}) {
        connectionsWithCompositeKey {
          items {
            id
            name
            sort
          }
        }
      }
    }
    `,
    {},
  );

  expect(mutationResponse4.data.createModel3).toBeDefined();
  const item4 = mutationResponse4.data.createModel3;
  expect(item4.connectionsWithCompositeKey.items.length).toEqual(1);
  expect(mutationResponse4.errors).not.toBeDefined();
});
