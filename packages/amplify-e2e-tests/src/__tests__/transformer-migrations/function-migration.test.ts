import {
  addApi,
  addFeatureFlag,
  amplifyPush,
  amplifyPushUpdate,
  configureAmplify,
  createNewProjectDir,
  deleteProject,
  deleteProjectDir,
  getApiKey,
  getConfiguredAppsyncClientAPIKeyAuth,
  initJSProjectWithProfile,
} from '@aws-amplify/amplify-e2e-core';
import { testQueries, updateSchemaInTestProject } from '../../schema-api-directives/common';
import { addSimpleFunction, updateFunctionNameInSchema } from '../../schema-api-directives/functionTester';

describe('api directives @function v1 to v2 migration', () => {
  let projectDir: string;

  beforeEach(async () => {
    projectDir = await createNewProjectDir('function');
    await initJSProjectWithProfile(projectDir, {});
  });

  afterEach(async () => {
    await deleteProject(projectDir);
    deleteProjectDir(projectDir);
  });

  it('function directive migration testing', async () => {
    const testModule = {
      func1,
      func2,
      schema,
      query,
      expected_result_query,
    };
    const v1TransformerVersion = 'v1';
    const v2TransformerVersion = 'v2';
    const function1Name = await addSimpleFunction(projectDir, testModule, 'func1');
    const function2Name = await addSimpleFunction(projectDir, testModule, 'func2');
    await addApi(projectDir, { transformerVersion: 1 });
    updateSchemaInTestProject(projectDir, testModule.schema);
    updateFunctionNameInSchema(projectDir, '<function1-name>', function1Name);
    updateFunctionNameInSchema(projectDir, '<function2-name>', function2Name);
    updateFunctionNameInSchema(projectDir, '<transformer-version>', v1TransformerVersion);
    await amplifyPush(projectDir);

    let awsconfig = configureAmplify(projectDir);
    let apiKey = getApiKey(projectDir);
    let appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

    await testQueries(testModule, appSyncClient);

    await addFeatureFlag(projectDir, 'graphqltransformer', 'transformerVersion', 2);
    await addFeatureFlag(projectDir, 'graphqltransformer', 'useExperimentalPipelinedTransformer', true);
    updateSchemaInTestProject(projectDir, testModule.schema);
    updateFunctionNameInSchema(projectDir, '<function1-name>', function1Name);
    updateFunctionNameInSchema(projectDir, '<function2-name>', function2Name);
    updateFunctionNameInSchema(projectDir, '<transformer-version>', v2TransformerVersion);
    await amplifyPushUpdate(projectDir);

    awsconfig = configureAmplify(projectDir);
    apiKey = getApiKey(projectDir);
    appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

    await testQueries(testModule, appSyncClient);
  });

  // schema
  const env = '${env}';
  const schema = `
    #Transformer Version: <transformer-version>
    type Query {
      doSomeWork(msg: String): String @function(name: "<function1-name>-${env}") @function(name: "<function2-name>-${env}")
    }
  `;

  // functions
  const func1 = `
    exports.handler = async event => {
      return event.arguments.msg + '|processed by worker-function';
    };
  `;
  const func2 = `
    exports.handler = async event => {
      return event.prev.result + '|processed by audit function';
    };
  `;

  // queries
  const query = `
    query DoSomeWork {
      doSomeWork(msg: "initial mutation message")
    }
  `;
  const expected_result_query = {
    data: {
      doSomeWork: 'initial mutation message|processed by worker-function|processed by audit function',
    },
  };
});
