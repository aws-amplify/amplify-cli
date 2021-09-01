import { 
  initJSProjectWithProfile, 
  deleteProject, 
  amplifyPushAuth, 
  getProjectMeta, 
  getCustomPoliciesPath, 
  overrideFunctionCodeNode ,
  invokeFunction,
  addFunction,
  addLambdaTrigger,
  addSimpleDDB,
  createNewProjectDir,
  deleteProjectDir
} from 'amplify-e2e-core';
import _ from 'lodash';
import { JSONUtilities } from 'amplify-cli-core';
import AWS from 'aws-sdk';

const customIAMPolicy: CustomIAMPolicy = {
  Effect: 'Allow',
  Action: [
    'ssm:GetParameter'
  ],
  Resource: []
};
const customIAMPolicies = {
  policies: []
}

let projRoot: string;

beforeEach(async () => {
  projRoot = await createNewProjectDir('testCusomtPolicies');
});

afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

it(`should init and deploy storage DynamoDB + Lambda trigger, attach custom policies to the Lambda`, async () => {
  await initJSProjectWithProfile(projRoot, {});
  const random = Math.floor(Math.random() * 10000);
  const funcName = `addCustomPoliciesToFunction${random}`;
  await addSimpleDDB(projRoot, {});

  await addFunction(
    projRoot,
    {
      name: funcName,
      functionTemplate: 'Lambda trigger',
      triggerType: 'DynamoDB',
      eventSource: 'DynamoDB'
    },
    'nodejs',
    addLambdaTrigger,
  );

  const meta = getProjectMeta(projRoot);
  const { Region: region } = meta?.providers?.awscloudformation;
  
  // Put SSM parameter
  const ssmClient = new AWS.SSM({ region });
  await ssmClient.putParameter({
    Name: 'testCustomPolicies',
    Value: 'testCustomPoliciesValue',
    Type: 'String',
    Overwrite: true,
  }).promise();
  
  const getParaResponse = await ssmClient.getParameter({
    Name: 'testCustomPolicies'
  }).promise();
  var ssmParameterArn = getParaResponse.Parameter.ARN;

  customIAMPolicy.Resource.push(ssmParameterArn);
  const customPoliciesPath = getCustomPoliciesPath(projRoot, 'function', funcName);
  customIAMPolicies.policies.push(customIAMPolicy);
  JSONUtilities.writeJson(customPoliciesPath, customIAMPolicies);

  overrideFunctionCodeNode(projRoot, funcName, 'get-ssm-parameter.js');
  
  await amplifyPushAuth(projRoot);

  const lambdaEvent = {
    secretName: 'testCustomPolicies',
  };
  

  // check that the lambda response includes the secret value
  const response = await invokeFunction(`${funcName}-integtest`, JSON.stringify(lambdaEvent), region);
  expect(JSON.parse(response.Payload.toString())?.Value).toEqual('testCustomPoliciesValue');
});

type CustomIAMPolicy = {
  Action: string[];
  Effect: string;
  Resource: string[];
}

