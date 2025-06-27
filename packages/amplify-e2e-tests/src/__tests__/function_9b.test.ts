import {
  addApiWithoutSchema,
  addApi,
  addFunction,
  addSimpleDDB,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  addNodeDependencies,
  readJsonFile,
  updateFunction,
  overrideFunctionCodeNode,
  getBackendConfig,
  updateApiSchema,
  createRandomName,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
import path from 'path';

const GraphQLTransformerLatestVersion = 2;

describe('nodejs', () => {
  describe('amplify add function with additional permissions', () => {
    let projRoot: string;
    beforeEach(async () => {
      projRoot = await createNewProjectDir('fn-with-perm');
    });

    afterEach(async () => {
      await deleteProject(projRoot);
      deleteProjectDir(projRoot);
    });

    it('function dependencies should be preserved when not editing permissions during `amplify update function`', async () => {
      const appName = createRandomName();
      await initJSProjectWithProfile(projRoot, {
        name: appName,
      });
      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, appName, 'two-model-schema.graphql');

      const random = generateRandomShortId();
      const fnName = `integtestfn${random}`;
      const ddbName = `ddbTable${random}`;

      await addSimpleDDB(projRoot, { name: ddbName });
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['api', 'storage'],
            resources: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
            resourceChoices: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
            operations: ['read'],
          },
        },
        'nodejs',
      );

      const configPath = path.join(projRoot, 'amplify', 'backend', 'backend-config.json');
      const metaPath = path.join(projRoot, 'amplify', 'backend', 'amplify-meta.json');
      const functionConfig = readJsonFile(configPath).function[fnName];
      const functionMeta = readJsonFile(metaPath).function[fnName];
      delete functionMeta.lastPushTimeStamp;

      await updateFunction(
        projRoot,
        {
          additionalPermissions: {
            permissions: [], // keep existing selection
            choices: ['api', 'storage', 'function'],
            resources: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
            keepExistingResourceSelection: true, // keep existing resource selection
            resourceChoices: [ddbName, 'Post:@model(appsync)', 'Comment:@model(appsync)'],
            operations: [], // keep existing selection
          },
        },
        'nodejs',
      );
      const updatedFunctionConfig = readJsonFile(configPath).function[fnName];
      const updatedFunctionMeta = readJsonFile(metaPath).function[fnName];
      delete updatedFunctionMeta.lastPushTimeStamp;
      expect(functionConfig).toStrictEqual(updatedFunctionConfig);
      expect(functionMeta).toStrictEqual(updatedFunctionMeta);
    });

    it('should be able to query AppSync with minimal permissions with featureFlag', async () => {
      const fnName = `apienvvar${generateRandomShortId()}`;
      const createTodo = `
      mutation CreateTodo($input: CreateTodoInput!) {
        createTodo(input: $input) {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    `;
      await initJSProjectWithProfile(projRoot, {});
      await addApi(projRoot, {
        IAM: {},
        transformerVersion: 1,
      });
      const beforeMeta = getBackendConfig(projRoot);
      const apiName = Object.keys(beforeMeta.api)[0];
      await addFunction(
        projRoot,
        {
          name: fnName,
          packageManager: { name: 'Yarn' },
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['Mutation'],
          },
        },
        'nodejs',
      );
      // Pin aws-appsync to 4.0.3 until https://github.com/awslabs/aws-mobile-appsync-sdk-js/issues/647 is fixed.
      addNodeDependencies(projRoot, fnName, ['aws-appsync@4.0.3', 'isomorphic-fetch', 'graphql-tag']);
      overrideFunctionCodeNode(projRoot, fnName, 'mutation-appsync.js');
      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Region: region, Name: functionName } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      const urlKey = Object.keys(lambdaCFN.Resources.LambdaFunction.Properties.Environment.Variables).filter((value) =>
        value.endsWith('GRAPHQLAPIENDPOINTOUTPUT'),
      )[0];
      const payloadObj = { urlKey, mutation: createTodo, variables: { input: { name: 'todo', description: 'sampleDesc' } } };
      const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);

      expect(fnResponse.StatusCode).toBe(200);
      expect(fnResponse.Payload).toBeDefined();
      const gqlResponse = JSON.parse(fnResponse.Payload.toString());

      expect(gqlResponse.data).toBeDefined();
      expect(gqlResponse.data.createTodo.name).toEqual('todo');
      expect(gqlResponse.data.createTodo.description).toEqual('sampleDesc');
    });

    it('should be able to query AppSync with minimal permissions with featureFlag for function and vNext GraphQL API', async () => {
      const appName = 'functiongqlvnext';
      const fnName = `apienvvar${generateRandomShortId()}`;
      const createTodo = `
        mutation CreateTodo($input: CreateTodoInput!) {
          createTodo(input: $input) {
            id
            name
            description
            createdAt
            updatedAt
          }
        }`;
      await initJSProjectWithProfile(projRoot, { name: appName });
      await addApi(projRoot, {
        IAM: {},
        transformerVersion: GraphQLTransformerLatestVersion,
      });
      updateApiSchema(projRoot, appName, 'iam_simple_model.graphql');
      const beforeMeta = getBackendConfig(projRoot);
      const apiName = Object.keys(beforeMeta.api)[0];
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          packageManager: { name: 'Yarn' },
          additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['Mutation'],
          },
        },
        'nodejs',
      );
      // Pin aws-appsync to 4.0.3 until https://github.com/awslabs/aws-mobile-appsync-sdk-js/issues/647 is fixed.
      addNodeDependencies(projRoot, fnName, ['aws-appsync@4.0.3', 'isomorphic-fetch', 'graphql-tag']);
      overrideFunctionCodeNode(projRoot, fnName, 'mutation-appsync.js');
      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Region: region, Name: functionName } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      const urlKey = Object.keys(lambdaCFN.Resources.LambdaFunction.Properties.Environment.Variables).filter((value) =>
        value.endsWith('GRAPHQLAPIENDPOINTOUTPUT'),
      )[0];
      const payloadObj = { urlKey, mutation: createTodo, variables: { input: { name: 'todo', description: 'sampleDesc' } } };
      const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);

      expect(fnResponse.StatusCode).toBe(200);
      expect(fnResponse.Payload).toBeDefined();
      const gqlResponse = JSON.parse(fnResponse.Payload.toString());

      expect(gqlResponse.data).toBeDefined();
      expect(gqlResponse.data.createTodo.name).toEqual('todo');
      expect(gqlResponse.data.createTodo.description).toEqual('sampleDesc');
    });
  });
});
