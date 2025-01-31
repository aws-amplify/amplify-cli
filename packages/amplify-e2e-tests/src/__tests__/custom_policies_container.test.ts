import {
  initJSProjectWithProfile,
  deleteProject,
  getProjectMeta,
  getCustomPoliciesPath,
  amplifyPushWithoutCodegen,
  readJsonFile,
  addRestContainerApiForCustomPolicies,
  amplifyConfigureProject,
  createNewProjectDir,
  deleteProjectDir,
} from '@aws-amplify/amplify-e2e-core';
import { JSONUtilities } from '@aws-amplify/amplify-cli-core';
import AWS from 'aws-sdk';
import path from 'path';

const customIAMPolicy: CustomIAMPolicy = {
  Effect: 'Allow',
  Action: ['ssm:GetParameter'],
  Resource: [],
};
const customIAMPolicies: CustomIAMPolicy[] = [];

async function setupAmplifyProject(cwd: string) {
  await amplifyConfigureProject({
    cwd,
    enableContainers: true,
  });
}
let projRoot: string;

beforeEach(async () => {
  projRoot = await createNewProjectDir('testCusomtPolicies');
});

afterEach(async () => {
  await deleteProject(projRoot);
  deleteProjectDir(projRoot);
});

it(`should init and deploy a api container, attach custom policies to the Fargate task`, async () => {
  const envName = 'devtest';
  const containerName = 'container';
  const name = 'containertest';
  await initJSProjectWithProfile(projRoot, { name: containerName, envName });
  await setupAmplifyProject(projRoot);
  await addRestContainerApiForCustomPolicies(projRoot, { name });

  const meta = getProjectMeta(projRoot);
  const { Region: region } = meta?.providers?.awscloudformation;

  // Put SSM parameter
  const ssmClient = new AWS.SSM({ region });
  await ssmClient
    .putParameter({
      Name: '/amplify/testCustomPolicies',
      Value: 'testCustomPoliciesValue',
      Type: 'String',
      Overwrite: true,
    })
    .promise();

  const getParaResponse = await ssmClient
    .getParameter({
      Name: '/amplify/testCustomPolicies',
    })
    .promise();
  const ssmParameterArn = getParaResponse.Parameter.ARN;

  customIAMPolicy.Resource.push(ssmParameterArn);
  const customPoliciesPath = getCustomPoliciesPath(projRoot, 'api', name);
  customIAMPolicies.push(customIAMPolicy);
  JSONUtilities.writeJson(customPoliciesPath, customIAMPolicies);

  await amplifyPushWithoutCodegen(projRoot);
  const containerCFN = readJsonFile(path.join(projRoot, 'amplify', 'backend', 'api', name, `${name}-cloudformation-template.json`));

  expect(containerCFN.Resources.CustomExecutionPolicyForContainer.Properties.PolicyDocument.Statement[0]).toEqual(customIAMPolicies[0]);
});

type CustomIAMPolicy = {
  Action: string[];
  Effect: string;
  Resource: string[];
};
