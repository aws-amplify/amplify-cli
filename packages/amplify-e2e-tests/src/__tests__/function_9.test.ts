import {
  addApiWithoutSchema,
  addApi,
  addDDBWithTrigger,
  addFunction,
  addSimpleDDB,
  amplifyPush,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  addNodeDependencies,
  readJsonFile,
  updateFunction,
  overrideFunctionCodeNode,
  getBackendConfig,
  addFeatureFlag,
  updateApiSchema,
  createRandomName,
} from 'amplify-e2e-core';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

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

    it('environment vars comment should update on permission update', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const random = Math.floor(Math.random() * 10000);
      const funcName = `nodetestfn${random}`;
      const ddbName = `nodetestddb`;

      await addFunction(
        projRoot,
        {
          name: funcName,
          functionTemplate: 'Hello World',
        },
        'nodejs',
      );
      await addSimpleDDB(projRoot, { name: ddbName });
      await updateFunction(
        projRoot,
        {
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['function', 'storage'],
            operations: ['read'],
            resources: [ddbName],
          },
        },
        'nodejs',
      );
      const lambdaHandlerContents = fs.readFileSync(
        path.join(projRoot, 'amplify', 'backend', 'function', funcName, 'src', 'index.js'),
        'utf8',
      );
      expect(lambdaHandlerContents).toMatchSnapshot();
    });

    it('adding api and storage permissions should not add duplicates to CFN', async () => {
      const appName = createRandomName();
      await initJSProjectWithProfile(projRoot, {
        name: appName,
      });
      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, appName, 'two-model-schema.graphql');

      const random = Math.floor(Math.random() * 10000);
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

      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      expect(lambdaCFN.Resources.AmplifyResourcesPolicy.Properties.PolicyDocument.Statement.length).toBe(3);
    });

    it('update DDB trigger function to add permissions should not changed its dependsOn attributes of the trigger source', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const ddbResourceName = 'testddbresource';
      await addDDBWithTrigger(projRoot, { ddbResourceName });

      const originalAmplifyMeta = getBackendAmplifyMeta(projRoot);
      const functionResourceName = Object.keys(originalAmplifyMeta.function)[0];
      const originalAttributes = originalAmplifyMeta.function[functionResourceName].dependsOn[0].attributes.sort();

      await updateFunction(
        projRoot,
        {
          additionalPermissions: {
            resources: [ddbResourceName],
            permissions: ['storage'],
            choices: ['function', 'storage'],
            operations: ['read', 'update'],
          },
        },
        'nodejs',
      );

      const updateAmplifyMeta = getBackendAmplifyMeta(projRoot);
      const updateAttributes = updateAmplifyMeta.function[functionResourceName].dependsOn[0].attributes.sort();
      expect(originalAttributes).toEqual(updateAttributes);

      await amplifyPushAuth(projRoot);
      const amplifyMeta = getBackendAmplifyMeta(projRoot);
      expect(amplifyMeta.function[functionResourceName].output).toBeDefined();
      expect(amplifyMeta.function[functionResourceName].output.Arn).toBeDefined();
    });

    it('function dependencies should be preserved when not editing permissions during `amplify update function`', async () => {
      const appName = createRandomName();
      await initJSProjectWithProfile(projRoot, {
        name: appName,
      });
      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, appName, 'two-model-schema.graphql');

      const random = Math.floor(Math.random() * 10000);
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
      const random = Math.floor(Math.random() * 10000);
      const fnName = `apienvvar${random}`;
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
      const { Region: region, Name: functionName } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      const urlKey = Object.keys(lambdaCFN.Resources.LambdaFunction.Properties.Environment.Variables).filter(value =>
        value.endsWith('GRAPHQLAPIENDPOINTOUTPUT'),
      )[0];
      const payloadObj = { urlKey, mutation: createTodo, variables: { input: { name: 'todo', description: 'sampleDesc' } } };
      const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);

      expect(fnResponse.StatusCode).toBe(200);
      expect(fnResponse.Payload).toBeDefined();
      const gqlResponse = JSON.parse(fnResponse.Payload as string);

      expect(gqlResponse.data).toBeDefined();
      expect(gqlResponse.data.createTodo.name).toEqual('todo');
      expect(gqlResponse.data.createTodo.description).toEqual('sampleDesc');
    });

    it('should be able to query AppSync with minimal permissions with featureFlag for function and vNext GraphQL API', async () => {
      const appName = 'functiongqlvnext';
      const random = Math.floor(Math.random() * 10000);
      const fnName = `apienvvar${random}`;
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
      const { Region: region, Name: functionName } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      const urlKey = Object.keys(lambdaCFN.Resources.LambdaFunction.Properties.Environment.Variables).filter(value =>
        value.endsWith('GRAPHQLAPIENDPOINTOUTPUT'),
      )[0];
      const payloadObj = { urlKey, mutation: createTodo, variables: { input: { name: 'todo', description: 'sampleDesc' } } };
      const fnResponse = await invokeFunction(functionName, JSON.stringify(payloadObj), region);

      expect(fnResponse.StatusCode).toBe(200);
      expect(fnResponse.Payload).toBeDefined();
      const gqlResponse = JSON.parse(fnResponse.Payload as string);

      expect(gqlResponse.data).toBeDefined();
      expect(gqlResponse.data.createTodo.name).toEqual('todo');
      expect(gqlResponse.data.createTodo.description).toEqual('sampleDesc');
    });

    it('should be able to make console calls with feature flag turned off', async () => {
      const random = Math.floor(Math.random() * 10000);
      const fnName = `apienvvar${random}`;
      await initJSProjectWithProfile(projRoot, {});
      await addApi(projRoot, {
        IAM: {},
        transformerVersion: 1,
      });
      const beforeMeta = getBackendConfig(projRoot);
      const apiName = Object.keys(beforeMeta.api)[0];
      addFeatureFlag(projRoot, 'appsync', 'generategraphqlpermissions', false);
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [apiName],
            operations: ['read'],
          },
        },
        'nodejs',
      );
      overrideFunctionCodeNode(projRoot, fnName, 'get-api-appsync.js');
      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Region: region, Name: functionName } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      const idKey = Object.keys(lambdaCFN.Resources.LambdaFunction.Properties.Environment.Variables).filter(value =>
        value.endsWith('GRAPHQLAPIIDOUTPUT'),
      )[0];
      const fnResponse = await invokeFunction(functionName, JSON.stringify({ idKey }), region);

      expect(fnResponse.StatusCode).toBe(200);
      expect(fnResponse.Payload).toBeDefined();
      const apiResponse = JSON.parse(fnResponse.Payload as string);
      expect(apiResponse.graphqlApi).toBeDefined();
      expect(apiResponse.graphqlApi.name).toContain(apiName);
    });
  });
});
