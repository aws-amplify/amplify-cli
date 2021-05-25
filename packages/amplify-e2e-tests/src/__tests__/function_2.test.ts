import {
  addApiWithSchema,
  addApi,
  addAuthWithDefault,
  addDDBWithTrigger,
  addFunction,
  addS3StorageWithSettings,
  addSimpleDDB,
  AddStorageSettings,
  amplifyPush,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta,
  getFunctionSrcNode,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  overrideFunctionSrcNode,
  addNodeDependencies,
  readJsonFile,
  updateFunction,
  overrideFunctionCodeNode,
  getBackendConfig,
  addFeatureFlag,
  addAuthWithGroupsAndAdminAPI,
  getFunction,
  loadFunctionTestFile,
} from 'amplify-e2e-core';
import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash';

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

    it('add lambda with AdminQueries API permissions', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      await addAuthWithGroupsAndAdminAPI(projRoot, {});
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['api'],
            resources: ['AdminQueries'],
            choices: ['auth', 'function', 'api'],
            operations: ['create', 'update', 'read', 'delete'],
          },
        },
        'nodejs',
      );
      await amplifyPushAuth(projRoot);
      const meta = getProjectMeta(projRoot);
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    });

    it('lambda with s3 permissions should be able to call listObjects', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      const s3Name = `integtestfn${random}`;
      const options: AddStorageSettings = {
        resourceName: s3Name,
        bucketName: s3Name,
      };
      await addAuthWithDefault(projRoot);
      await addS3StorageWithSettings(projRoot, options);
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            resources: [s3Name],
            choices: ['auth', 'storage', 'function', 'api'],
            operations: ['create', 'update', 'read', 'delete'],
          },
        },
        'nodejs',
      );

      let functionCode = loadFunctionTestFile('s3-list-objects.js');

      // Update the env var name in function code
      functionCode.replace('{{bucketEnvVar}}', `STORAGE_INTEGTESTFN${random}_BUCKETNAME`);

      overrideFunctionSrcNode(projRoot, fnName, functionCode);

      await amplifyPushForce(projRoot);
      const meta = getProjectMeta(projRoot);
      const { BucketName: bucketName, Region: region } = Object.keys(meta.storage).map(key => meta.storage[key])[0].output;
      expect(bucketName).toBeDefined();
      expect(region).toBeDefined();
      const { Name: functionName } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(functionName).toBeDefined();
      const result1 = await invokeFunction(functionName, null, region);
      expect(result1.StatusCode).toBe(200);
      expect(result1.Payload).toBeDefined();
    });

    it('lambda with dynamoDB permissions should be able to scan ddb', async () => {
      await initJSProjectWithProfile(projRoot, {});

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      const ddbName = `integtestddb${random}`;

      // test ability to scan both appsync @model-backed and regular ddb tables
      await addApiWithSchema(projRoot, 'simple_model.graphql');
      await addSimpleDDB(projRoot, { name: ddbName });

      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['api', 'storage', 'function'],
            resources: [ddbName, 'Todo:@model(appsync)'],
            resourceChoices: [ddbName, 'Todo:@model(appsync)'],
            operations: ['read'],
          },
        },
        'nodejs',
      );

      const functionCode = loadFunctionTestFile('dynamodb-scan.js');

      overrideFunctionSrcNode(projRoot, fnName, functionCode);

      await amplifyPush(projRoot);
      const meta = getProjectMeta(projRoot);
      const { GraphQLAPIIdOutput: appsyncId } = Object.keys(meta.api).map(key => meta.api[key])[0].output;
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(appsyncId).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();

      // test @model-backed dynamoDB scan
      const result1 = await invokeFunction(functionName, JSON.stringify({ tableName: `Todo-${appsyncId}-integtest` }), region);
      expect(result1.StatusCode).toBe(200);
      expect(result1.Payload).toBeDefined();

      const payload1 = JSON.parse(result1.Payload.toString());
      expect(payload1.errorType).toBeUndefined();
      expect(payload1.errorMessage).toBeUndefined();
      expect(payload1.Items).toBeDefined();
      expect(payload1.Count).toBeDefined();
      expect(payload1.ScannedCount).toBeDefined();

      // test regular storage resource dynamoDB scan
      const { Name: tableName } = Object.keys(meta.storage).map(key => meta.storage[key])[0].output;
      const result2 = await invokeFunction(functionName, JSON.stringify({ tableName }), region);
      expect(result2.StatusCode).toBe(200);
      expect(result2.Payload).toBeDefined();

      const payload2 = JSON.parse(result2.Payload.toString());
      expect(payload2.errorType).toBeUndefined();
      expect(payload2.errorMessage).toBeUndefined();
      expect(payload2.Items).toBeDefined();
      expect(payload2.Count).toBeDefined();
      expect(payload2.ScannedCount).toBeDefined();
    });

    it('existing lambda updated with additional permissions should be able to scan ddb', async () => {
      await initJSProjectWithProfile(projRoot, {});

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
        },
        'nodejs',
      );

      const functionCode = loadFunctionTestFile('dynamodb-scan.js');

      overrideFunctionSrcNode(projRoot, fnName, functionCode);

      await amplifyPushAuth(projRoot);
      let meta = getProjectMeta(projRoot);
      const { Arn: functionArn, Name: functionName, Region: region } = Object.keys(meta.function).map(key => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();

      await addApiWithSchema(projRoot, 'simple_model.graphql');
      await updateFunction(
        projRoot,
        {
          name: fnName,
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['function', 'api', 'storage'],
            resources: ['Todo:@model(appsync)'],
            resourceChoices: ['Todo:@model(appsync)'],
            operations: ['read'],
          },
        },
        'nodejs',
      );
      await amplifyPush(projRoot);

      meta = getProjectMeta(projRoot);
      const { GraphQLAPIIdOutput: appsyncId } = Object.keys(meta.api).map(key => meta.api[key])[0].output;
      const result = await invokeFunction(functionName, JSON.stringify({ tableName: `Todo-${appsyncId}-integtest` }), region);
      expect(result.StatusCode).toBe(200);
      expect(result.Payload).toBeDefined();

      const payload = JSON.parse(result.Payload.toString());
      expect(payload.errorType).toBeUndefined();
      expect(payload.errorMessage).toBeUndefined();
      expect(payload.Items).toBeDefined();
      expect(payload.Count).toBeDefined();
      expect(payload.ScannedCount).toBeDefined();
    });

    it('@model-backed lambda function should generate envvars TODOTABLE_NAME, TODOTABLE_ARN, GRAPHQLAPIIDOUTPUT', async () => {
      await initJSProjectWithProfile(projRoot, {});
      await addApiWithSchema(projRoot, 'simple_model.graphql');

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;

      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['storage'],
            choices: ['api', 'storage'],
            resources: ['Todo:@model(appsync)'],
            resourceChoices: ['Todo:@model(appsync)'],
            operations: ['read'],
          },
        },
        'nodejs',
      );

      const lambdaSource = getFunctionSrcNode(projRoot, fnName);
      expect(lambdaSource.includes('TODOTABLE_NAME')).toBeTruthy();
      expect(lambdaSource.includes('TODOTABLE_ARN')).toBeTruthy();
      expect(lambdaSource.includes('GRAPHQLAPIIDOUTPUT')).toBeTruthy();
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
      await initJSProjectWithProfile(projRoot, {});
      await addApiWithSchema(projRoot, 'two-model-schema.graphql');

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
      await addDDBWithTrigger(projRoot, {});

      const originalAmplifyMeta = getBackendAmplifyMeta(projRoot);
      const functionResourceName = Object.keys(originalAmplifyMeta.function)[0];
      const originalAttributes = originalAmplifyMeta.function[functionResourceName].dependsOn[0].attributes.sort();

      await updateFunction(
        projRoot,
        {
          permissions: ['storage'],
          choices: ['function', 'storage'],
          operations: ['read', 'update'],
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
      await initJSProjectWithProfile(projRoot, {});
      await addApiWithSchema(projRoot, 'two-model-schema.graphql');

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

      // Don't update anything, sends 'n' to the question:
      // Do you want to update the Lambda function permissions to access...?
      await updateFunction(projRoot, {}, 'nodejs');
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
      addNodeDependencies(projRoot, fnName, ['aws-appsync', 'isomorphic-fetch', 'graphql-tag']);
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
