import { ResourceConstants } from 'graphql-transformer-common';
import { GraphQLTransform } from 'graphql-transformer-core';
import { DynamoDBModelTransformer } from 'graphql-dynamodb-transformer';
import { ModelConnectionTransformer } from 'graphql-connection-transformer';
import { KeyTransformer } from 'graphql-key-transformer';
import { ModelAuthTransformer } from 'graphql-auth-transformer';
import { CloudFormationClient } from '../CloudFormationClient';
import { Output } from 'aws-sdk/clients/cloudformation';
import { GraphQLClient } from '../GraphQLClient';
import { deploy } from '../deployNestedStacks';
import emptyBucket from '../emptyBucket';
import { S3Client } from '../S3Client';
import { default as S3 } from 'aws-sdk/clients/s3';
import { default as moment } from 'moment';

jest.setTimeout(2000000);

const cf = new CloudFormationClient('us-west-2');
const customS3Client = new S3Client('us-west-2');
const awsS3Client = new S3({ region: 'us-west-2' });

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

    type Model1 @model(subscriptions: null) @key(fields: ["id", "sort" ])
    {
        id: ID!
        sort: Int!
        name: String!
    }
    type Model2 @model(subscriptions: null)
    {
        id: ID!
        connection: Model1 @connection(sortField: "modelOneSort")
        modelOneSort: Int!
    }
    `;

  const transformer = new GraphQLTransform({
    transformers: [
      new DynamoDBModelTransformer(),
      new ModelConnectionTransformer(),
      new KeyTransformer(),
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
    console.log('Creating Stack ' + STACK_NAME);
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
    console.log('Successfully created stack ' + STACK_NAME);
    expect(finishedStack).toBeDefined();
    console.log(JSON.stringify(finishedStack, null, 4));
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
  try {
    console.log('Deleting stack ' + STACK_NAME);
    await cf.deleteStack(STACK_NAME);
    await cf.waitForStack(STACK_NAME);
    console.log('Successfully deleted stack ' + STACK_NAME);
  } catch (e) {
    if (e.code === 'ValidationError' && e.message === `Stack with id ${STACK_NAME} does not exist`) {
      // The stack was deleted. This is good.
      expect(true).toEqual(true);
      console.log('Successfully deleted stack ' + STACK_NAME);
    } else {
      console.error(e);
      expect(true).toEqual(false);
    }
  }
  try {
    await emptyBucket(BUCKET_NAME);
  } catch (e) {
    console.error(`Failed to empty S3 bucket: ${e}`);
  }
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
