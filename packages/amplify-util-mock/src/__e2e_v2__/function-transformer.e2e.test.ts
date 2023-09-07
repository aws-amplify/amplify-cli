import { deploy, logDebug, GraphQLClient } from '../__e2e__/utils';
import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import { transformAndSynth, defaultTransformParams } from './test-synthesizer';

jest.setTimeout(2000000);

const ECHO_FUNCTION_NAME = `echoFunction`;
const HELLO_FUNCTION_NAME = `hello`;

let GRAPHQL_CLIENT: GraphQLClient;
let server: AmplifyAppSyncSimulator;

describe('@function transformer', () => {
  beforeAll(async () => {
    const validSchema = `
      type Query {
        echo(msg: String!): Context @function(name: "${ECHO_FUNCTION_NAME}")
        duplicate(msg: String!): Context @function(name: "${ECHO_FUNCTION_NAME}")
        pipeline(msg: String!): String @function(name: "${ECHO_FUNCTION_NAME}") @function(name: "${HELLO_FUNCTION_NAME}")
        pipelineReverse(msg: String!): Context @function(name: "${HELLO_FUNCTION_NAME}") @function(name: "${ECHO_FUNCTION_NAME}")
      }

      type Context {
        arguments: Arguments
        typeName: String
        fieldName: String
      }

      type Arguments {
        msg: String!
      }`;
    try {
      const out = transformAndSynth({
        ...defaultTransformParams,
        schema: validSchema,
      });
      const result = await deploy(out);
      server = result.simulator;

      const endpoint = server.url + '/graphql';
      logDebug(`Using graphql url: ${endpoint}`);

      const apiKey = result.config.appSync.apiKey;
      GRAPHQL_CLIENT = new GraphQLClient(endpoint, { 'x-api-key': apiKey });
    } catch (e) {
      logDebug(e);
      console.warn(`Could not setup function: ${e}`);
    }
  });

  afterAll(async () => {
    try {
      if (server) {
        await server.stop();
      }
    } catch (e) {
      console.error(e);
      throw e;
    }
  });

  /**
   * Test queries below
   */
  test('simple echo function', async () => {
    const response = await GRAPHQL_CLIENT.query(
      `query {
        echo(msg: "Hello") {
          arguments {
            msg
          }
          typeName
          fieldName
        }
      }`,
      {},
    );

    logDebug(JSON.stringify(response, null, 4));
    expect(response.data.echo.arguments.msg).toEqual('Hello');
    expect(response.data.echo.typeName).toEqual('Query');
    expect(response.data.echo.fieldName).toEqual('echo');
  });

  test('simple duplicate function', async () => {
    const response = await GRAPHQL_CLIENT.query(
      `query {
          duplicate(msg: "Hello") {
              arguments {
                  msg
              }
              typeName
              fieldName
          }
      }`,
      {},
    );
    logDebug(JSON.stringify(response, null, 4));
    expect(response.data.duplicate.arguments.msg).toEqual('Hello');
    expect(response.data.duplicate.typeName).toEqual('Query');
    expect(response.data.duplicate.fieldName).toEqual('duplicate');
  });

  test('pipeline of @function(s)', async () => {
    const response = await GRAPHQL_CLIENT.query(
      `query {
          pipeline(msg: "IGNORED")
      }`,
      {},
    );
    logDebug(JSON.stringify(response, null, 4));
    expect(response.data.pipeline).toEqual('Hello, world!');
  });

  test('pipelineReverse of @function(s)', async () => {
    const response = await GRAPHQL_CLIENT.query(
      `query {
          pipelineReverse(msg: "Hello") {
              arguments {
                  msg
              }
              typeName
              fieldName
          }
      }`,
      {},
    );
    logDebug(JSON.stringify(response, null, 4));
    expect(response.data.pipelineReverse.arguments.msg).toEqual('Hello');
    expect(response.data.pipelineReverse.typeName).toEqual('Query');
    expect(response.data.pipelineReverse.fieldName).toEqual('pipelineReverse');
  });
});
