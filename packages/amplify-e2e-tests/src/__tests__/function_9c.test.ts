import {
  addApiWithoutSchema,
  addApi,
  addFunction,
  amplifyPush,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getProjectMeta,
  initJSProjectWithProfile,
  invokeFunction,
  readJsonFile,
  updateFunction,
  overrideFunctionCodeNode,
  getBackendConfig,
  addFeatureFlag,
  updateApiSchema,
  createRandomName,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
import path from 'path';

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

    it('should be able to make console calls with feature flag turned off', async () => {
      const fnName = `apienvvar${generateRandomShortId()}`;
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
      const { Region: region, Name: functionName } = Object.keys(meta.function).map((key) => meta.function[key])[0].output;
      const lambdaCFN = readJsonFile(
        path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`),
      );
      const idKey = Object.keys(lambdaCFN.Resources.LambdaFunction.Properties.Environment.Variables).filter((value) =>
        value.endsWith('GRAPHQLAPIIDOUTPUT'),
      )[0];
      const fnResponse = await invokeFunction(functionName, JSON.stringify({ idKey }), region);

      expect(fnResponse.StatusCode).toBe(200);
      expect(fnResponse.Payload).toBeDefined();
      const apiResponse = JSON.parse(fnResponse.Payload.transformToString());
      expect(apiResponse.graphqlApi).toBeDefined();
      expect(apiResponse.graphqlApi.name).toContain(apiName);
    });

    it('allows granting of API access then revoking it', async () => {
      const appName = createRandomName();

      await initJSProjectWithProfile(projRoot, { name: appName });
      await addApiWithoutSchema(projRoot);
      await updateApiSchema(projRoot, appName, 'simple_model.graphql');

      const fnName = `integtestfn${generateRandomShortId()}`;

      await addFunction(
        projRoot,
        {
          name: fnName,
          functionTemplate: 'Hello World',
          additionalPermissions: {
            permissions: ['api'],
            choices: ['api'],
            resources: [appName],
            operations: ['Mutation'],
          },
        },
        'nodejs',
      );

      let lambdaCFN = readJsonFile(path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`));

      expect(lambdaCFN.Resources.AmplifyResourcesPolicy.Properties.PolicyDocument.Statement.length).toBe(1);

      await updateFunction(
        projRoot,
        {
          additionalPermissions: {
            permissions: ['api'], // unselects 'api'
            choices: ['api'],
          },
        },
        'nodejs',
      );

      lambdaCFN = readJsonFile(path.join(projRoot, 'amplify', 'backend', 'function', fnName, `${fnName}-cloudformation-template.json`));

      expect(lambdaCFN?.Resources?.AmplifyResourcesPolicy?.Properties?.PolicyDocument?.Statement?.length).toBeUndefined();
    });
  });
});
