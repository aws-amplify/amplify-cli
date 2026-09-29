import {
  addAuthWithDefault,
  addFunction,
  addS3StorageWithSettings,
  AddStorageSettings,
  amplifyPushAuth,
  amplifyPushForce,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  overrideFunctionSrcNode,
  addAuthWithGroupsAndAdminAPI,
  getFunction,
  loadFunctionTestFile,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';

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
      const fnName = `integtestfn${generateRandomShortId()}`;
      await addAuthWithGroupsAndAdminAPI(projRoot);
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
      const {
        Arn: functionArn,
        Name: functionName,
        Region: region,
      } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      expect(functionArn).toBeDefined();
      expect(functionName).toBeDefined();
      expect(region).toBeDefined();
      const cloudFunction = await getFunction(functionName, region);
      expect(cloudFunction.Configuration.FunctionArn).toEqual(functionArn);
    });

    it('lambda with s3 permissions should be able to call listObjects', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const random = generateRandomShortId();
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

      const functionCode = loadFunctionTestFile('s3-list-objects.js');

      // Update the env var name in function code
      functionCode.replace('{{bucketEnvVar}}', `STORAGE_INTEGTESTFN${random}_BUCKETNAME`);

      overrideFunctionSrcNode(projRoot, fnName, functionCode);

      await amplifyPushForce(projRoot);
      const meta = getProjectMeta(projRoot);
      const { BucketName: bucketName, Region: region } = Object.keys(meta.storage).map((key) => meta.storage[key])[0].output;
      expect(bucketName).toBeDefined();
      expect(region).toBeDefined();
      const { Name: functionName } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      expect(functionName).toBeDefined();
      const result1 = await invokeFunction(functionName, null, region);
      expect(result1.StatusCode).toBe(200);
      expect(result1.Payload).toBeDefined();
    });
  });
});
