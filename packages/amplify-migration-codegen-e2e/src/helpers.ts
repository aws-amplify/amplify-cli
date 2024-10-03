import {
  deleteProject as deleteGen1Project,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  amplifyPushAuth,
  getProjectMeta,
  getUserPool,
  npmInstall,
  getNpxPath,
  nspawn as spawn,
  addS3WithGuestAccess,
  checkIfBucketExists,
  addFunction,
  functionBuild,
  getFunction,
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import path from 'node:path';
import { CloudControlClient, GetResourceCommand, ListResourcesCommand, ListResourcesCommandOutput } from '@aws-sdk/client-cloudcontrol';
import { unset } from 'lodash';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

export async function copyTsFile(sourcePath: string, destinationPath: string): Promise<void> {
  const content = await fs.readFile(sourcePath, 'utf8');

  // Replace the first occurrence of 'event' with 'event: any'
  const modifiedContent = content.replace(/(exports\.handler\s*=\s*async\s*\(\s*)event(\s*\))/, '$1event: any$2');

  await fs.writeFile(destinationPath, modifiedContent, 'utf8');
}

async function listResourcesByType(typeName: string, region: string) {
  const client = new CloudControlClient({ region });
  const resources = [];
  const command = new ListResourcesCommand({
    TypeName: typeName,
  });
  const response: ListResourcesCommandOutput = await client.send(command);
  if (response.ResourceDescriptions) {
    resources.push(...response.ResourceDescriptions.map((rd) => JSON.parse(rd.Properties ?? '')));
  }
  return resources;
}

async function getResourceDetails(typeName: string, identifier: string, region: string) {
  const client = new CloudControlClient({ region });
  const command = new GetResourceCommand({
    TypeName: typeName,
    Identifier: identifier,
  });
  const response = await client.send(command);
  return JSON.parse(response.ResourceDescription.Properties);
}

export function runGen2SandboxCommand(cwd: string) {
  npmInstall(cwd);
  return spawn(getNpxPath(), ['ampx', 'sandbox', '--once'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

export function runCodegenCommand(cwd: string) {
  return spawn(getNpxPath(), ['@aws-amplify/migrate', 'to-gen-2', 'generate-code'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

function deleteGen2Sandbox(cwd: string) {
  return spawn(getNpxPath(), ['ampx', 'sandbox', 'delete'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  })
    .wait("Are you sure you want to delete all the resources in your sandbox environment (This can't be undone)?")
    .sendConfirmYes()
    .wait('Finished deleting.')
    .runAsync();
}

export async function setupAndPushGen1Project(projRoot: string, projectName: string) {
  await initJSProjectWithProfile(projRoot, { name: projectName, disableAmplifyAppCreation: false, includeGen2RecommendationPrompt: false });
  await addAuthWithDefault(projRoot);
  await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
  await functionBuild(projRoot);
  await addS3WithGuestAccess(projRoot);
  await amplifyPushAuth(projRoot);
}

export async function assertGen1Setup(projRoot: string) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const { UserPoolId: gen1UserPoolId } = Object.keys(gen1Meta.auth).map((key) => gen1Meta.auth[key])[0].output;
  const { Arn: gen1FunctionArn, Name: gen1FunctionName } = Object.keys(gen1Meta.function).map((key) => gen1Meta.function[key])[0].output;
  const { BucketName: gen1BucketName } = Object.keys(gen1Meta.storage).map((key) => gen1Meta.storage[key])[0].output;

  expect(gen1Region).toBeDefined();

  const cloudUserPool = await getUserPool(gen1UserPoolId, gen1Region);
  expect(cloudUserPool.UserPool).toBeDefined();

  expect(gen1FunctionArn).toBeDefined();
  expect(gen1FunctionName).toBeDefined();
  const cloudFunction = await getFunction(gen1FunctionName, gen1Region);
  expect(cloudFunction.Configuration?.FunctionArn).toEqual(gen1FunctionArn);

  expect(gen1BucketName).toBeDefined();
  const bucketExists = await checkIfBucketExists(gen1BucketName, gen1Region);
  expect(bucketExists).toMatchObject({});
  return { gen1UserPoolId, gen1FunctionName, gen1BucketName, gen1Region };
}

export async function assertUserPoolResource(projRoot: string, gen1UserPoolId: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Cognito::UserPool', gen1UserPoolId, gen1Region);
  removeProperties(gen1Resource, ['ProviderURL', 'ProviderName', 'UserPoolId', 'Arn']);
  // TODO: remove below line after EmailMessage, EmailSubject, SmsMessage, SmsVerificationMessage, EmailVerificationMessage, EmailVerificationSubject, AccountRecoverySetting inconsistency is fixed
  removeProperties(gen1Resource, [
    'UserPoolTags',
    'VerificationMessageTemplate.EmailMessage',
    'VerificationMessageTemplate.EmailSubject',
    'EmailVerificationSubject',
    'AccountRecoverySetting',
    'EmailVerificationMessage',
  ]);
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2UserPoolId = gen2Meta.auth.user_pool_id;
  const gen2Region = gen2Meta.auth.aws_region;
  const gen2Resource = await getResourceDetails('AWS::Cognito::UserPool', gen2UserPoolId, gen2Region);
  removeProperties(gen2Resource, ['ProviderURL', 'ProviderName', 'UserPoolId', 'Arn']);
  // TODO: remove below line after EmailMessage, EmailSubject, SmsMessage, SmsVerificationMessage, EmailVerificationMessage, EmailVerificationSubject, AccountRecoverySetting inconsistency is fixed
  removeProperties(gen2Resource, [
    'UserPoolTags',
    'VerificationMessageTemplate.EmailMessage',
    'VerificationMessageTemplate.SmsMessage',
    'VerificationMessageTemplate.EmailSubject',
    'SmsVerificationMessage',
    'EmailVerificationSubject',
    'AccountRecoverySetting',
    'EmailVerificationMessage',
  ]);
  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertStorageResource(projRoot: string, gen1BucketName: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::S3::Bucket', gen1BucketName, gen1Region);
  removeProperties(gen1Resource, ['DualStackDomainName', 'DomainName', 'BucketName', 'Arn', 'RegionalDomainName', 'Tags', 'WebsiteURL']);
  // TODO: remove below line after CorsConfiguration.CorsRules[0].Id inconsistency is fixed
  removeProperties(gen1Resource, ['CorsConfiguration.CorsRules[0].Id']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2BucketName = gen2Meta.storage.bucket_name;
  const gen2Region = gen2Meta.storage.aws_region;
  const gen2Resource = await getResourceDetails('AWS::S3::Bucket', gen2BucketName, gen2Region);
  removeProperties(gen2Resource, ['DualStackDomainName', 'DomainName', 'BucketName', 'Arn', 'RegionalDomainName', 'Tags', 'WebsiteURL']);

  expect(gen2Resource).toEqual(gen1Resource);
}

export async function assertFunctionResource(projRoot: string, gen1FunctionName: string, gen1Region: string) {
  const gen1Resource = await getResourceDetails('AWS::Lambda::Function', gen1FunctionName, gen1Region);
  removeProperties(gen1Resource, ['Arn', 'FunctionName', 'LoggingConfig.LogGroup', 'Role']);
  // TODO: remove below line after RecursiveLoop, RuntimeManagementConfig, Tags is fixed
  removeProperties(gen1Resource, ['RecursiveLoop', 'RuntimeManagementConfig', 'Tags']);

  const gen2Meta = getProjectOutputs(projRoot);
  const gen2Region = gen2Meta.auth.aws_region;

  // Workaround as amplify_outputs.json file doesn't have function metadata
  const gen2Resources = await listResourcesByType('AWS::Lambda::Function', gen2Region);
  const gen2Resource = gen2Resources.find((resource) => {
    const functionName = resource.FunctionName;
    return functionName.includes('amplify-mygen2app') && functionName.includes(gen1FunctionName.split('-')[0]);
  });
  removeProperties(gen2Resource, ['Arn', 'FunctionName', 'LoggingConfig.LogGroup', 'Role']);
  // TODO: remove below line after Environment.Variables.AMPLIFY_SSM_ENV_CONFIG inconsistency is fixed
  removeProperties(gen2Resource, ['Environment.Variables.AMPLIFY_SSM_ENV_CONFIG']);

  expect(gen2Resource).toEqual(gen1Resource);
}

function removeProperties(obj: Record<string, unknown>, propertiesToRemove: string[]) {
  propertiesToRemove.forEach((prop) => unset(obj, prop));
}

const getProjectOutputsPath = (projectRoot: string) => path.join(projectRoot, 'amplify_outputs.json');

const getProjectOutputs = (projectRoot: string): $TSAny => {
  const metaFilePath: string = getProjectOutputsPath(projectRoot);
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};

export async function cleanupProjects(cwd: string) {
  await deleteGen1Project(path.join(cwd, '.amplify', 'migration'));
  await deleteGen2Sandbox(cwd);
  deleteProjectDir(cwd);
}
