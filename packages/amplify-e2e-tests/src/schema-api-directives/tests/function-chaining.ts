import { addApi, amplifyPush } from 'amplify-e2e-core';

import { getApiKey, configureAmplify, getConfiguredAppsyncClientAPIKeyAuth } from '../authHelper';

import { updateSchemaInTestProject, testQueries } from '../common';

import { addSimpleFunction, updateFunctionNameInSchema } from '../functionTester';

export async function runTest(projectDir: string, testModule: any) {
  const function1Name = await addSimpleFunction(projectDir, testModule, 'func1');
  const function2Name = await addSimpleFunction(projectDir, testModule, 'func2');
  await addApi(projectDir);
  updateSchemaInTestProject(projectDir, testModule.schema);
  updateFunctionNameInSchema(projectDir, '<function1-name>', function1Name);
  updateFunctionNameInSchema(projectDir, '<function2-name>', function2Name);
  await amplifyPush(projectDir);

  const awsconfig = configureAmplify(projectDir);
  const apiKey = getApiKey(projectDir);
  const appSyncClient = getConfiguredAppsyncClientAPIKeyAuth(awsconfig.aws_appsync_graphqlEndpoint, awsconfig.aws_appsync_region, apiKey);

  await testQueries(testModule, appSyncClient);
}

//schema
const env = '${env}';
export const schema = `
#error: when type Mutation is the only type in the schema, the following error is received:
#Resource Name: hcst2d2aj5bzfit67twczmvgkqGraphQLSchema (AWS::AppSync::GraphQLSchema)
#Event Type: create
#Reason: Schema Creation Status is FAILED with details: Found 1 problem(s) with the schema:
#There is no top level schema object defined.
#Changed Mutation to Query
#change: replace the dummy "worker-function" function name with  "<function1-name>" placeholder, the test will replace it with the actual function name
#change: replace the dummy "audit-function" function name with  "<function2-name>" placeholder, the test will replace it with the actual function name

type Query {
  doSomeWork(msg: String): String @function(name: "<function1-name>-${env}") @function(name: "<function2-name>-${env}")
}
`;

//functions
export const func1 = `
//#extra
exports.handler = async event => {
  return event.arguments.msg + '|processed by worker-function';
};
`;
export const func2 = `
//#extra
exports.handler = async event => {
  return event.prev.result + '|processed by audit function';
};
`;

//queries
export const query = `
#extra
query DoSomeWork {
  doSomeWork(msg: "initial mutation message")
}
`;
export const expected_result_query = {
  data: {
    doSomeWork: 'initial mutation message|processed by worker-function|processed by audit function',
  },
};
