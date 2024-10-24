import assert from 'node:assert';
import execa from 'execa';
import path from 'node:path';
import * as fs from 'fs-extra';
import { getNpxPath, retry, RetrySettings } from '@aws-amplify/amplify-e2e-core';
import { runGen2SandboxCommand } from './sandbox';
import { getCommandsFromReadme } from './migrationReadmeParser';
import { toggleEnvVariable } from './envVariables';
import { getGen1ResourceDetails } from './gen1ResourceDetailsFetcher';
import { getGen2ResourceDetails } from './gen2ResourceDetailsFetcher';

export type RefactorCategory = 'auth' | 'storage';

const RETRY_CONFIG: RetrySettings = {
  times: 50,
  delayMS: 1000, // 1 second
  timeoutMS: 1000 * 60 * 5, // 5 minutes
  stopOnError: true,
};

const STATUS_COMPLETE = 'COMPLETE';
const STATUS_IN_PROGRESS = 'IN_PROGRESS';
const STATUS_FAILED = 'FAILED';

export function runTemplategenCommand(cwd: string, gen1StackName: string, gen2StackName: string) {
  const parentDir = path.resolve(cwd, '..');
  const processResult = execa.sync(
    getNpxPath(),
    ['--prefix', parentDir, '@aws-amplify/migrate', 'to-gen-2', 'generate-templates', '--from', gen1StackName, '--to', gen2StackName],
    {
      cwd,
      env: { ...process.env, npm_config_user_agent: 'npm' },
      encoding: 'utf-8',
    },
  );

  if (processResult.exitCode !== 0) {
    throw new Error(`Templategen command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

function uncommentS3BucketLineFromBackendFile(projRoot: string) {
  const backendFilePath = path.join(projRoot, 'amplify', 'backend.ts');
  const backendFileContent = fs.readFileSync(backendFilePath, 'utf8');
  const regex = /^\s*\/\/\s*(s3Bucket\.bucketName)/m;
  const updatedBackendFileContent = backendFileContent.replace(regex, '$1');
  fs.writeFileSync(backendFilePath, updatedBackendFileContent);
}

async function executeCommand(command: string, cwd?: string) {
  cwd = cwd ?? process.cwd();
  const processResult = execa.sync(command, {
    cwd,
    env: { ...process.env, npm_config_user_agent: 'npm' },
    encoding: 'utf-8',
    shell: true,
  });
  if (processResult.exitCode === 0) {
    return processResult.stdout;
  } else {
    throw new Error(`Command exit code: ${processResult.exitCode}, message: ${processResult.stderr}`);
  }
}

async function executeCreateStackRefactorCallCommand(command: string, cwd: string) {
  const processResult = JSON.parse(await executeCommand(command, cwd));
  const stackRefactorId = processResult.StackRefactorId;
  return stackRefactorId;
}

async function executeStep1(cwd: string, commands: string[]) {
  await executeCommand(commands[0], cwd);
  await retry(
    () => assertStepCompletion(commands[1]),
    (status) => status.includes(STATUS_COMPLETE) && !status.includes(STATUS_IN_PROGRESS),
    RETRY_CONFIG,
    (status) => status.includes(STATUS_FAILED),
  );
}

async function executeStep2(cwd: string, commands: string[]) {
  await executeCommand(commands[0], cwd);
  await retry(
    () => assertStepCompletion(commands[1]),
    (status) => status.includes(STATUS_COMPLETE) && !status.includes(STATUS_IN_PROGRESS),
    RETRY_CONFIG,
    (status) => status.includes(STATUS_FAILED),
  );
}

async function executeStep3(cwd: string, commands: string[], bucketName: string) {
  toggleEnvVariable('BUCKET_NAME', 'SET', bucketName);
  await executeCommand(commands[1], cwd);
  await executeCommand(commands[2], cwd);
  const stackRefactorId = await executeCreateStackRefactorCallCommand(commands[3], cwd);
  toggleEnvVariable('STACK_REFACTOR_ID', 'SET', stackRefactorId);
  await retry(
    () => assertRefactorStepCompletion(commands[5]),
    (status) => status.includes(STATUS_COMPLETE) && !status.includes(STATUS_IN_PROGRESS),
    RETRY_CONFIG,
    (status) => status.includes(STATUS_FAILED),
  );
  await executeCommand(commands[6], cwd);
  await retry(
    () => assertRefactorStepCompletion(commands[7]),
    (status) => status.includes(STATUS_COMPLETE) && !status.includes(STATUS_IN_PROGRESS),
    RETRY_CONFIG,
    (status) => status.includes(STATUS_FAILED),
  );
}

async function assertStepCompletion(command: string) {
  const processResult = JSON.parse(await executeCommand(command));
  return processResult.Stacks[0].StackStatus;
}

async function assertRefactorStepCompletion(command: string) {
  const processResult = JSON.parse(await executeCommand(command));
  return processResult.Status;
}

export async function stackRefactor(projRoot: string, category: RefactorCategory, bucketName: string) {
  const { gen1ResourceIds, gen1ResourceDetails } = await getGen1ResourceDetails(projRoot, category);

  const readmeFilePath = path.join(projRoot, '.amplify', 'migration', 'templates', category, 'MIGRATION_README.md');
  const readmeContent = fs.readFileSync(readmeFilePath, 'utf-8');
  const { step1Commands, step2commands, step3Commands } = getCommandsFromReadme(readmeContent);

  await executeStep1(projRoot, step1Commands);
  await executeStep2(projRoot, step2commands);
  await executeStep3(projRoot, step3Commands, bucketName);

  if (category === 'storage') await uncommentS3BucketLineFromBackendFile(projRoot);

  await runGen2SandboxCommand(projRoot);

  toggleEnvVariable('BUCKET_NAME', 'DELETE');
  toggleEnvVariable('STACK_REFACTOR_ID', 'DELETE');

  const { gen2ResourceIds, gen2ResourceDetails } = await getGen2ResourceDetails(projRoot, category);
  assert.deepEqual(gen1ResourceIds, gen2ResourceIds);
  assert.deepEqual(gen1ResourceDetails, gen2ResourceDetails);
}
