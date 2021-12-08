import {
  addApiWithoutSchema,
  updateApiSchema,
  addAuthWithDefault,
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
  getFunctionSrcNode,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  overrideFunctionSrcNode,
  updateFunction,
  addAuthWithGroupsAndAdminAPI,
  getFunction,
  loadFunctionTestFile,
  createRandomName,
} from 'amplify-e2e-core';
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
      await initJSProjectWithProfile(projRoot, {
        name: 'dynamodbscan',
      });

      const random = Math.floor(Math.random() * 10000);
      const fnName = `integtestfn${random}`;
      const ddbName = `integtestddb${random}`;

      // test ability to scan both appsync @model-backed and regular ddb tables
      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, 'dynamodbscan', 'simple_model.graphql');
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
      const appName = createRandomName();
      await initJSProjectWithProfile(projRoot, {
        name: appName,
      });

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

      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, appName, 'simple_model.graphql');
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
      await initJSProjectWithProfile(projRoot, {
        name: 'modelbackedlambda',
      });
      await addApiWithoutSchema(projRoot, { transformerVersion: 1 });
      await updateApiSchema(projRoot, 'modelbackedlambda', 'simple_model.graphql');

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
  });
});
