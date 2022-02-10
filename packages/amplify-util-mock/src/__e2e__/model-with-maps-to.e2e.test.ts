import { ModelTransformer } from '@aws-amplify/graphql-model-transformer';
import { MapsToTransformer } from '@aws-amplify/graphql-maps-to-transformer';
import { AuthTransformer } from '@aws-amplify/graphql-auth-transformer';
import { GraphQLTransform } from '@aws-amplify/graphql-transformer-core';
import { GraphQLClient } from './utils/graphql-client';
import { deploy, launchDDBLocal, logDebug, terminateDDB } from './utils/index';

let graphqlClient;
let server;

let dbPath;
let ddbEmulator;

beforeAll(async () => {
  const validSchema = `
    type Todo @model @mapsTo(name: "Task") @auth(rules: [{allow: public}]) {
        id: ID!
        title: String!
        description: String
    }
    `;
  try {
    const transformer = new GraphQLTransform({
      transformers: [new ModelTransformer(), new AuthTransformer(), new MapsToTransformer()],
    });
    const out = transformer.transform(validSchema);

    let ddbClient;
    ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
    const result = await deploy(out, ddbClient);
    server = result.simulator;

    const endpoint = server.url + '/graphql';
    logDebug(`Using graphql url: ${endpoint}`);

    const apiKey = result.config.appSync.apiKey;
    graphqlClient = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
  } catch (e) {
    logDebug(e);
    console.warn(`Could not setup mock server: ${e}`);
  }
});

afterAll(async () => {
  try {
    if (server) {
      await server.stop();
    }
    await terminateDDB(ddbEmulator, dbPath);
  } catch (e) {
    console.error(e);
    expect(true).toEqual(false);
  }
});

/**
 * Test queries below
 */
test('Model with original name specified points to original table', async () => {
  const response = await graphqlClient.query(
    `mutation {
        createTodo(input: {title: "Test Todo"}) {
            id
            title
        }
    }`,
    {},
  );
  logDebug(JSON.stringify(response, null, 2));
  expect(response?.data?.createTodo?.id).toBeDefined();
  expect(response?.data?.createTodo?.title).toEqual('Test Todo');
  // successful response means that it was able to write to the original table correctly
});
