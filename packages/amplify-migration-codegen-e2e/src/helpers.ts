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
} from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import path from 'node:path';
import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';
import { unset } from 'lodash';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

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
  await initJSProjectWithProfile(projRoot, { name: projectName, disableAmplifyAppCreation: false });
  await addAuthWithDefault(projRoot);
  await amplifyPushAuth(projRoot);
}

export async function assertGen1Setup(projRoot: string) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1UserPoolId = Object.keys(gen1Meta.auth).map((key) => gen1Meta.auth[key])[0].output.UserPoolId;
  const gen1Region = gen1Meta.providers.awscloudformation.Region;
  const userPool = await getUserPool(gen1UserPoolId, gen1Region);
  expect(userPool.UserPool).toBeDefined();
  return { gen1UserPoolId, gen1Region };
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
