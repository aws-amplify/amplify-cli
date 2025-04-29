import assert from 'node:assert';
import execa from 'execa';
import path from 'node:path';
import * as fs from 'fs-extra';
import { getNpxPath, getProjectMeta } from '@aws-amplify/amplify-e2e-core';
import { runGen2SandboxCommand } from './sandbox';
import { getGen1ResourceDetails } from './gen1ResourceDetailsFetcher';
import { getGen2ResourceDetails } from './gen2ResourceDetailsFetcher';
import { describeStackResources, MIGRATE_TOOL_VERSION } from '.';

export type RefactorCategory = 'auth' | 'storage';

export function runExecuteCommand(cwd: string, gen1StackName: string, gen2StackName: string) {
  console.log(`running execute command in ${cwd} for ${gen1StackName}->${gen2StackName}`);
  const parentDir = path.resolve(cwd, '..');
  const processResult = execa.sync(
    getNpxPath(),
    [
      '--prefix',
      parentDir,
      `@aws-amplify/migrate@${MIGRATE_TOOL_VERSION}`,
      'to-gen-2',
      'execute',
      '--from',
      gen1StackName,
      '--to',
      gen2StackName,
    ],
    {
      cwd,
      env: { ...process.env, npm_config_user_agent: 'npm' },
      encoding: 'utf-8',
    },
  );
  console.log(processResult);

  if (processResult.exitCode !== 0) {
    throw new Error(`Execute command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

export function runRevertCommand(cwd: string, gen1StackName: string, gen2StackName: string) {
  console.log(`running revert command in ${cwd} for ${gen2StackName}->${gen1StackName}`);
  const parentDir = path.resolve(cwd, '..');
  const processResult = execa.sync(
    getNpxPath(),
    [
      '--prefix',
      parentDir,
      `@aws-amplify/migrate@${MIGRATE_TOOL_VERSION}`,
      'to-gen-2',
      'revert',
      '--from',
      gen2StackName,
      '--to',
      gen1StackName,
    ],
    {
      cwd,
      env: { ...process.env, npm_config_user_agent: 'npm' },
      encoding: 'utf-8',
    },
  );
  console.log(processResult);

  if (processResult.exitCode !== 0) {
    throw new Error(`Revert command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

function uncommentS3BucketLineFromBackendFile(projRoot: string) {
  const backendFilePath = path.join(projRoot, 'amplify', 'backend.ts');
  const backendFileContent = fs.readFileSync(backendFilePath, 'utf8');
  const regex = /^\s*\/\/\s*(s3Bucket\.bucketName)/m;
  const updatedBackendFileContent = backendFileContent.replace(regex, '$1');
  fs.writeFileSync(backendFilePath, updatedBackendFileContent);
}

function uncommentTagsLineFromBackendFile(projRoot: string) {
  const backendFilePath = path.join(projRoot, 'amplify', 'backend.ts');
  const backendFileContent = fs.readFileSync(backendFilePath, 'utf8');
  const regex = /^\s*\/\/\s*(Tags\.of)/m;
  const updatedBackendFileContent = backendFileContent.replace(regex, '$1');
  fs.writeFileSync(backendFilePath, updatedBackendFileContent);
}

export async function runGen2DeployPostExecute(projRoot: string, projName: string, envName: string, categories: RefactorCategory[]) {
  if (categories.includes('storage')) {
    uncommentS3BucketLineFromBackendFile(projRoot);
  }
  uncommentTagsLineFromBackendFile(projRoot);
  await runGen2SandboxCommand(projRoot, projName);
}

export async function assertExecuteCommand(projRoot: string, categories: RefactorCategory[]) {
  for (const category of categories) {
    console.log(`Asserting post execute for ${category}...`);

    const { gen1ResourceIds } = await getGen1ResourceDetails(projRoot, category);
    const { gen2ResourceIds } = await getGen2ResourceDetails(projRoot, category);

    assert.deepEqual(gen1ResourceIds, gen2ResourceIds);
    console.log(`Asserted post execute for ${category}`);
  }
}

export async function assertRevertCommand(projRoot: string, categories: RefactorCategory[]) {
  const gen1Meta = getProjectMeta(projRoot);
  const gen1StackName = gen1Meta.providers.awscloudformation.StackName;
  const region = gen1Meta.providers.awscloudformation.Region;
  const gen1RootStackResources = await describeStackResources(gen1StackName, region);
  for (const category of categories) {
    console.log(`Asserting post revert for ${category}...`);

    const { gen1ResourceIds } = await getGen1ResourceDetails(projRoot, category, true);

    assert(gen1StackName);
    assert(region);
    const gen1CategoryStackResource = gen1RootStackResources.find(
      (gen1RootStackResource) =>
        gen1RootStackResource.ResourceType === 'AWS::CloudFormation::Stack' &&
        gen1RootStackResource.LogicalResourceId?.startsWith(category),
    );
    assert(gen1CategoryStackResource);
    const gen1CategoryStackName = gen1CategoryStackResource.PhysicalResourceId;
    assert(gen1CategoryStackName);
    const gen1StackResources = await describeStackResources(gen1CategoryStackName, region);
    for (const gen1ResourceId of gen1ResourceIds) {
      assert(gen1ResourceId && typeof gen1ResourceId === 'string');
      const movedGen1Resource = gen1StackResources.some((gen1StackResource) => gen1StackResource.PhysicalResourceId === gen1ResourceId);
      assert(movedGen1Resource, `Expected ${gen1ResourceId} to be moved to Gen 1 ${category} stack after revert`);
    }

    console.log(`Asserted post revert for ${category}`);
  }
}
