import {
  deleteProject as deleteGen1Project,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  amplifyPush,
  getNpxPath,
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
import { deleteGen2Sandbox } from './sandbox';
import assert from 'node:assert';
import { updatePackageDependency } from './updatePackageJson';

export * from './sdk_calls';
export * from './assertions';
export * from './projectOutputs';
export * from './updatePackageJson';
export * from './sandbox';

export const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

export const MIGRATE_TOOL_VERSION = '0.1.0-next-6.0';
export const BACKEND_DATA_VERSION = '0.0.0-test-20250416182614';

export async function setupAndPushDefaultGen1Project(projRoot: string, projName: string) {
  await initJSProjectWithProfile(projRoot, { name: projName, disableAmplifyAppCreation: false, includeGen2RecommendationPrompt: false });
  await addAuthWithDefault(projRoot);
  await addFunction(projRoot, { functionTemplate: 'Hello World' }, 'nodejs');
  await functionBuild(projRoot);
  await addS3WithGuestAccess(projRoot);
  await addApiWithoutSchema(projRoot, { transformerVersion: 2 });
  updateApiSchema(projRoot, projName, 'simple_model.graphql');
  await amplifyPush(projRoot);
  addFeatureFlag(projRoot, 'graphqltransformer', 'enablegen2migration', true);
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
  console.log(`initializing project ${projName} at ${projRoot}`);
  await initJSProjectWithProfile(projRoot, { name: projName, disableAmplifyAppCreation: false, includeGen2RecommendationPrompt: false });
  await addAuthWithDefault(projRoot);
  await addS3WithTrigger(projRoot);
  await amplifyPushAuth(projRoot);
  console.log(`pushed auth successfully`);
}

export function runCodegenCommand(cwd: string) {
  console.log(`running codegen command in ${cwd}`);
  const processResult = execa.sync(getNpxPath(), [`@aws-amplify/migrate@${MIGRATE_TOOL_VERSION}`, 'to-gen-2', 'prepare'], {
    cwd,
    env: { ...process.env, npm_config_user_agent: 'npm' },
    encoding: 'utf-8',
  });
  console.log(processResult);
  if (processResult.exitCode !== 0) {
    throw new Error(`Codegen command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

export async function cleanupProjects(cwd: string, projName: string) {
  await deleteGen1Project(path.join(cwd, '.amplify', 'migration'));
  await deleteGen2Sandbox(cwd, projName);
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

export function extractFunctionResourceName(functionName: string, envName: string): string {
  const functionResourceName = functionName.split(`-${envName}`)[0];
  assert(functionResourceName, 'Function resource name not available');
  return functionResourceName;
}

export function updateAmplifyBackendPackagesVersion(projRoot: string) {
  updatePackageDependency(projRoot, '@aws-amplify/backend-data', BACKEND_DATA_VERSION);
  updatePackageDependency(projRoot, '@aws-amplify/backend', BACKEND_DATA_VERSION);
}
