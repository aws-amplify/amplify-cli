import {
  addApiWithoutSchema,
  addDDBWithTrigger,
  addFunction,
  addSimpleDDB,
  amplifyPushAuth,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getBackendAmplifyMeta,
  initJSProjectWithProfile,
  readJsonFile,
  updateFunction,
  updateApiSchema,
  createRandomName,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';
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

    it('environment vars comment should update on permission update', async () => {
      await initJSProjectWithProfile(projRoot, {});
      const funcName = `nodetestfn${generateRandomShortId()}`;
      const ddbName = 'nodetestddb';

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
  });
});
