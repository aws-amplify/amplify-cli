import {
  initJSProjectWithProfile,
  deleteProject,
  amplifyPushAuth,
  getProjectMeta,
  getCustomPoliciesPath,
  overrideFunctionCodeNode,
  invokeFunction,
  addFunction,
  addLambdaTrigger,
  addSimpleDDB,
  createNewProjectDir,
  deleteProjectDir,
  generateRandomShortId,
} from '@aws-amplify/amplify-e2e-core';

import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import { GetParameterCommand, PutParameterCommand, SSMClient } from '@aws-sdk/client-ssm';

const customIAMPolicy: CustomIAMPolicy = {
  Effect: 'Allow',
  Action: ['ssm:GetParameter'],
  Resource: [],
};
const customIAMPolicies: CustomIAMPolicy[] = [];

let projRoot: string;

beforeEach(async () => {
  projRoot = await createNewProjectDir('testCusomtPolicies');
});

afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

it('should init and deploy storage DynamoDB + Lambda trigger, attach custom policies to the Lambda', async () => {
  await initJSProjectWithProfile(projRoot, {});
  const funcName = `addCustomPoliciesToFunction${generateRandomShortId()}`;
  await addSimpleDDB(projRoot, {});

  await addFunction(
    projRoot,
    {
      name: funcName,
      functionTemplate: 'Lambda trigger',
      triggerType: 'DynamoDB',
      eventSource: 'DynamoDB',
    },
    'nodejs',
    addLambdaTrigger,
  );

  const meta = getProjectMeta(projRoot);
  const region = meta?.providers?.awscloudformation.Region ?? undefined;

  // Put SSM parameter
  const ssmClient = new SSMClient({ region });
  await ssmClient.send(
    new PutParameterCommand({
      Name: '/amplify/testCustomPolicies',
      Value: 'testCustomPoliciesValue',
      Type: 'String',
      Overwrite: true,
    }),
  );

  const getParaResponse = await ssmClient.send(
    new GetParameterCommand({
      Name: '/amplify/testCustomPolicies',
    }),
  );
  const ssmParameterArn = getParaResponse.Parameter.ARN;

  customIAMPolicy.Resource.push(ssmParameterArn);
  const customPoliciesPath = getCustomPoliciesPath(projRoot, 'function', funcName);
  customIAMPolicies.push(customIAMPolicy);
  JSONUtilities.writeJson(customPoliciesPath, customIAMPolicies);

  overrideFunctionCodeNode(projRoot, funcName, 'get-ssm-parameter.js');

  await amplifyPushAuth(projRoot);

  const lambdaEvent = {
    secretName: '/amplify/testCustomPolicies',
  };

  // check that the lambda response includes the secret value
  const response = await invokeFunction(`${funcName}-integtest`, JSON.stringify(lambdaEvent), region);
  console.log(response.Payload);
  expect(JSON.parse(response.Payload.transformToString())?.Value).toEqual('testCustomPoliciesValue');
});

type CustomIAMPolicy = {
  Action: string[];
  Effect: string;
  Resource: string[];
};
