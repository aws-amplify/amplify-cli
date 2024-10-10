import {
  deleteProject as deleteGen1Project,
  deleteProjectDir,
  initJSProjectWithProfile,
  addAuthWithDefault,
  amplifyPush,
  npmInstall,
  getNpxPath,
  nspawn as spawn,
  addS3WithGuestAccess,
  addFunction,
  functionBuild,
  addApiWithoutSchema,
  updateApiSchema,
  amplifyPushForce,
  addFeatureFlag,
} from '@aws-amplify/amplify-e2e-core';
import { updatePackageDependency } from './updatePackageJson';
import path from 'node:path';
import { unset } from 'lodash';

export * from './sdk-calls';
export * from './assertions';
export * from './projectOutputs';
export * from './updatePackageJson';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

export async function setupAndPushGen1Project(projRoot: string, projName: string) {
  await initJSProjectWithProfile(projRoot, { name: projName, disableAmplifyAppCreation: false });
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

export function runCodegenCommand(cwd: string) {
  return spawn(getNpxPath(), ['@aws-amplify/migrate', 'to-gen-2', 'generate-code'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
    env: { ...process.env, npm_config_user_agent: 'npm' },
  }).runAsync();
}

export async function runGen2SandboxCommand(cwd: string) {
  updatePackageDependency(cwd, '@aws-amplify/backend', '0.0.0-test-20241003180022');
  npmInstall(cwd);
  return new Promise((resolve, reject) => {
    let stackName: string;
    spawn(getNpxPath(), ['ampx', 'sandbox', '--once'], {
      cwd,
      stripColors: true,
      noOutputTimeout: pushTimeoutMS,
      env: { ...process.env, npm_config_user_agent: 'npm' },
    })
      .wait(/arn:aws:cloudformation:.*:stack\/([^/]+)\//, (data) => {
        const match = data.match(/arn:aws:cloudformation:.*:stack\/([^/]+)\//);
        if (match) {
          stackName = match[1];
        }
      })
      .run((err: Error) => {
        if (!err && stackName) {
          resolve(stackName);
        } else {
          reject(err);
        }
      });
  });
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
