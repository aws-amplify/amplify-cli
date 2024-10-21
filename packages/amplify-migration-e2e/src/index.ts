import {
  deleteProject as deleteGen1Project,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  amplifyPush,
  getNpxPath,
  nspawn as spawn,
  addS3WithGuestAccess,
  addFunction,
  functionBuild,
  addApiWithoutSchema,
  updateApiSchema,
  amplifyPushForce,
  addFeatureFlag,
  amplifyPushAuth,
  addAuthWithGroupTrigger,
  updateAuthAddUserGroups,
  updateAuthToAddSignInSignOutUrlAfterPull,
  addS3WithTrigger,
} from '@aws-amplify/amplify-e2e-core';
import path from 'node:path';
import { unset } from 'lodash';
import execa from 'execa';

export * from './sdk_calls';
export * from './assertions';
export * from './projectOutputs';
export * from './updatePackageJson';
export * from './templategen';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

export async function setupAndPushDefaultGen1Project(projRoot: string, projName: string) {
  await initJSProjectWithProfile(projRoot, { name: projName, disableAmplifyAppCreation: false, includeGen2RecommendationPrompt: false });
  await addAuthWithDefault(projRoot);
  await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
  await functionBuild(projRoot);
  await addS3WithGuestAccess(projRoot);
  await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
  await updateApiSchema(projRoot, projName, 'simple_model.graphql');
  await amplifyPush(projRoot);
  await addFeatureFlag(projRoot, 'graphqltransformer', 'enablegen2migration', true);
  await amplifyPushForce(projRoot);
}

export async function setupAndPushAuthWithMaxOptionsGen1Project(projRoot: string, projName: string) {
  await initJSProjectWithProfile(projRoot, { name: projName, disableAmplifyAppCreation: false, includeGen2RecommendationPrompt: false });
  await addAuthWithGroupTrigger(projRoot);
  await updateAuthAddUserGroups(projRoot, ['Admins', 'Users']);
  await updateAuthToAddSignInSignOutUrlAfterPull(projRoot, {
    signinUrl: 'https://signin1.com/',
    signoutUrl: 'https://signout1.com/',
    testingWithLatestCodebase: true,
    updateSigninUrl: 'https://updatesignin1.com/',
    updateSignoutUrl: 'https://updatesignout1.com/',
  });
  await amplifyPushAuth(projRoot);
}

export async function setupAndPushStorageWithMaxOptionsGen1Project(projRoot: string, projName: string) {
  await initJSProjectWithProfile(projRoot, { name: projName, disableAmplifyAppCreation: false, includeGen2RecommendationPrompt: false });
  await addAuthWithDefault(projRoot);
  await addS3WithTrigger(projRoot);
  await amplifyPushAuth(projRoot);
}

export function runCodegenCommand(cwd: string) {
  const processResult = execa.sync(getNpxPath(), ['@aws-amplify/migrate', 'to-gen-2', 'generate-code'], {
    cwd,
    env: { ...process.env, npm_config_user_agent: 'npm' },
    encoding: 'utf-8',
  });
  if (processResult.exitCode !== 0) {
    throw new Error(`Codegen command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

export async function runGen2SandboxCommand(cwd: string) {
  const processResult = execa.sync(getNpxPath(), ['ampx', 'sandbox', '--once'], {
    cwd,
    env: { ...process.env, npm_config_user_agent: 'npm' },
    encoding: 'utf-8',
  });
  if (processResult.exitCode === 0) {
    const match = processResult.stdout.match(/arn:aws:cloudformation:.*:stack\/([^/]+)\//);
    if (match) {
      return match[1];
    } else {
      throw new Error('Stack name not found in the command output');
    }
  } else {
    throw new Error(`Sandbox command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
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

export async function cleanupProjects(cwd: string) {
  await deleteGen1Project(path.join(cwd, '.amplify', 'migration'));
  await deleteGen2Sandbox(cwd);
  deleteProjectDir(cwd);
}

export function removeProperties(obj: Record<string, unknown>, propertiesToRemove: string[]) {
  propertiesToRemove.forEach((prop) => unset(obj, prop));
}

export function removeErrorThrows(content: string): string {
  const lines = content.split('\n');
  const result = lines.filter((line) => {
    const trimmedLine = line.trim();
    return !trimmedLine.startsWith('throw new Error(');
  });
  return result.join('\n');
}
