import {
  deleteProject as deleteGen1Project,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  amplifyPushAuth,
  getProjectMeta,
  getUserPool,
} from '@aws-amplify/amplify-e2e-core';
import { npmInstall, getNpxPath, nspawn as spawn } from '@aws-amplify/amplify-e2e-core';
import * as fs from 'fs-extra';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import path from 'node:path';
import assert from 'node:assert';
import { CloudControlClient, GetResourceCommand } from '@aws-sdk/client-cloudcontrol';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

export async function getResourceDetails(typeName: string, identifier: string, region: string) {
  const client = new CloudControlClient({ region });
  const command = new GetResourceCommand({
    TypeName: typeName,
    Identifier: identifier,
  });

  try {
    const response = await client.send(command);
    return JSON.parse(response.ResourceDescription.Properties);
  } catch (error) {
    console.error('Error fetching resource details:', error);
    throw error;
  }
}

export function deployGen2CDK(cwd: string) {
  try {
    npmInstall(cwd);
  } catch (error) {
    console.error('Failed to install dependencies:', error);
    throw error;
  }
  return spawn(getNpxPath(), ['ampx', 'sandbox', '--once'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

export function migrateCommand(cwd: string) {
  return spawn(getNpxPath(), ['@aws-amplify/migrate', 'to-gen-2', 'generate-code'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

export function deleteGen2Project(cwd: string) {
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

export async function setupGen1Project(projRoot: string, projectName: string) {
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

export async function assertGen2Resources(projRoot: string, gen1UserPoolId: string, gen1Region: string) {
  let gen1Resource = await getResourceDetails('AWS::Cognito::UserPool', gen1UserPoolId, gen1Region);
  // TODO: remove below line after EmailMessage, EmailSubject, SmsMessage, SmsVerificationMessage, EmailVerificationMessage, EmailVerificationSubject, AccountRecoverySetting inconsistency is fixed
  gen1Resource = removeNestedJsonKeys(gen1Resource, [
    'UserPoolTags',
    'VerificationMessageTemplate.EmailMessage',
    'VerificationMessageTemplate.EmailSubject',
    'ProviderURL',
    'ProviderName',
    'UserPoolId',
    'EmailVerificationSubject',
    'Arn',
    'AccountRecoverySetting',
    'EmailVerificationMessage',
  ]);
  const gen2Meta = getProjectOutputs(projRoot);
  const gen2UserPoolId = gen2Meta.auth.user_pool_id;
  const gen2Region = gen2Meta.auth.aws_region;
  let gen2Resource = await getResourceDetails('AWS::Cognito::UserPool', gen2UserPoolId, gen2Region);
  // TODO: remove below line after EmailMessage, EmailSubject, SmsMessage, SmsVerificationMessage, EmailVerificationMessage, EmailVerificationSubject, AccountRecoverySetting inconsistency is fixed
  gen2Resource = removeNestedJsonKeys(gen2Resource, [
    'UserPoolTags',
    'VerificationMessageTemplate.EmailMessage',
    'VerificationMessageTemplate.SmsMessage',
    'VerificationMessageTemplate.EmailSubject',
    'SmsVerificationMessage',
    'ProviderURL',
    'ProviderName',
    'UserPoolId',
    'EmailVerificationSubject',
    'Arn',
    'AccountRecoverySetting',
    'EmailVerificationMessage',
  ]);
  expect(gen2Resource).toEqual(gen1Resource);
}

function removeNestedJsonKeys<T extends Record<string, unknown>>(obj: T, keysToRemove: string[]): T {
  const result = { ...obj };
  keysToRemove.forEach((path) => {
    const parts = path.split('.');
    let current: Record<string, unknown> = result;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (current[part] === undefined || current[part] === null) {
        return; // Path doesn't exist, nothing to delete
      }
      current = current[part] as Record<string, unknown>;
    }
    const lastPart = parts[parts.length - 1];
    if (current && current !== null && lastPart in current) {
      delete current[lastPart];
    }
  });
  return result;
}

export const getProjectOutputsPath = (projectRoot: string) => path.join(projectRoot, 'amplify_outputs.json');

export const getProjectOutputs = (projectRoot: string): $TSAny => {
  const metaFilePath: string = getProjectOutputsPath(projectRoot);
  return JSON.parse(fs.readFileSync(metaFilePath, 'utf8'));
};

export async function migrateCodegen(projRoot: string) {
  await assert.doesNotReject(migrateCommand(projRoot), 'Codegen failed');
}

export async function deployGen2Project(projRoot: string) {
  await assert.doesNotReject(deployGen2CDK(projRoot), 'Gen2 CDK deployment failed');
}

export async function cleanupProjects(cwd: string) {
  await deleteGen1Project(path.join(cwd, '.amplify', 'migration'));
  await deleteGen2Project(cwd);
  deleteProjectDir(cwd);
}
