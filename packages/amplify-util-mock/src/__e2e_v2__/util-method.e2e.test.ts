import { AmplifyAppSyncSimulator } from '@aws-amplify/amplify-appsync-simulator';
import { deploy, launchDDBLocal, terminateDDB, logDebug, reDeploy, GraphQLClient } from '../__e2e__/utils';
import { transformAndSynth, defaultTransformParams } from './test-synthesizer';

let GRAPHQL_ENDPOINT: string;
let GRAPHQL_CLIENT: GraphQLClient;
let ddbEmulator = null;
let dbPath = null;
let server: AmplifyAppSyncSimulator;

jest.setTimeout(2000000);

const runTransformer = async (validSchema: string) =>
  transformAndSynth({
    ...defaultTransformParams,
    schema: validSchema,
    transformParameters: {
      ...defaultTransformParams.transformParameters,
      sandboxModeEnabled: true,
    },
  });

let ddbClient;
const validSchema = /* GraphQL */ `
  type Post @model {
    id: ID!
    title: String!
  }
`;

describe('$util method', () => {
  beforeAll(async () => {
    try {
      const out = await runTransformer(validSchema);
      ({ dbPath, emulator: ddbEmulator, client: ddbClient } = await launchDDBLocal());
      const result = await deploy(out, ddbClient);
      server = result.simulator;

      GRAPHQL_ENDPOINT = server.url + '/graphql';
      logDebug(`Using graphql url: ${GRAPHQL_ENDPOINT}`);

      const apiKey = result.config.appSync.apiKey;
      logDebug(apiKey);
      GRAPHQL_CLIENT = new GraphQLClient(GRAPHQL_ENDPOINT, {
        'x-api-key': apiKey,
      });
    } catch (e) {
      logDebug('error when setting up test');
      logDebug(e);
      throw e;
    }
  });

  afterEach(async () => {
    const out = await runTransformer(validSchema);
    await reDeploy(out, server, ddbClient);
  });

  afterAll(async () => {
    if (server) {
      await server.stop();
    }
    await terminateDDB(ddbEmulator, dbPath);
  });

  describe('$util.validate', () => {
    let transformerOutput;
    const queryString = /* GraphQL */ `
      query getPost {
        getPost(id: "10") {
          id
          title
        }
      }
    `;
    beforeEach(async () => {
      transformerOutput = await runTransformer(validSchema);
    });
    test('it should not throw error when validation condition is true', async () => {
      transformerOutput.resolvers[
        'Query.getPost.res.vtl'
      ] = `$util.validate(true, "Validation Error", "ValidationError", { "id": "11", "title": "Title Sent from Error" })\n$util.toJson({"id": 11, "title": "Non Error title"})`;
      await reDeploy(transformerOutput, server, ddbClient);
      const response = await GRAPHQL_CLIENT.query(queryString, {});
      expect(response.data).toBeDefined();
      expect(response.data.getPost.id).toEqual('11');
      expect(response.data.getPost.title).toEqual('Non Error title');
      expect(response.errors).not.toBeDefined();
    });

    test('$util.validate should throw error and pass the data along with error message and error type when the condition fails', async () => {
      transformerOutput.resolvers[
        'Query.getPost.req.vtl'
      ] = `$util.validate(false, "Validation Error", "ValidationError", { "id": "10", "title": "Title Sent from Error" })`;
      await reDeploy(transformerOutput, server, ddbClient);

      const response = await GRAPHQL_CLIENT.query(queryString, {});
      expect(response.data).toBeDefined();
      expect(response.data.getPost.id).toEqual('10');
      expect(response.data.getPost.title).toEqual('Title Sent from Error');

      expect(response.errors).toBeDefined();
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].message).toEqual('Validation Error');
      expect((response.errors[0] as any).errorType).toEqual('ValidationError');
    });

    test('$util.validate should return error message and CustomTemplateException when error type is not passed', async () => {
      transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error")`;
      await reDeploy(transformerOutput, server, ddbClient);

      const response = await GRAPHQL_CLIENT.query(queryString, {});
      expect(response.data).toBeDefined();
      expect(response.data.getPost).toBe(null);

      expect(response.errors).toBeDefined();
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].message).toEqual('Validation Error');
      expect((response.errors[0] as any).errorType).toEqual('CustomTemplateException');
    });

    test('$util.validate should allow overriding the error type', async () => {
      transformerOutput.resolvers['Query.getPost.req.vtl'] = `$util.validate(false, "Validation Error", "MyErrorType")`;
      await reDeploy(transformerOutput, server, ddbClient);

      const response = await GRAPHQL_CLIENT.query(queryString, {});
      expect(response.data).toBeDefined();
      expect(response.data.getPost).toBe(null);

      expect(response.errors).toBeDefined();
      expect(response.errors).toHaveLength(1);
      expect(response.errors[0].message).toEqual('Validation Error');
      expect((response.errors[0] as any).errorType).toEqual('MyErrorType');
    });
  });
});
