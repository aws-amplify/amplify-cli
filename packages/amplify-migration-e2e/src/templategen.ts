import assert from 'node:assert';
import execa from 'execa';
import path from 'node:path';
import * as fs from 'fs-extra';
import { getNpxPath, readJsonFile, retry, RetrySettings } from '@aws-amplify/amplify-e2e-core';
import { runGen2SandboxCommand } from './sandbox';
import { getRollbackCommandsFromReadme, getStackRefactorCommandsFromReadme, readMigrationReadmeFile } from './migrationReadmeParser';
import { envVariable } from './envVariables';
import { getGen1ResourceDetails } from './gen1ResourceDetailsFetcher';
import { getGen2ResourceDetails } from './gen2ResourceDetailsFetcher';
import { removeProperties } from '.';

export type RefactorCategory = 'auth' | 'storage';

const RETRY_CONFIG: RetrySettings = {
  times: 50,
  delayMS: 1000, // 1 second
  timeoutMS: 1000 * 60 * 5, // 5 minutes
  stopOnError: true,
};

const STATUS_AVAILABLE = 'AVAILABLE';
const STATUS_EXECUTE_COMPLETE = 'EXECUTE_COMPLETE';
const STATUS_UPDATE_COMPLETE = 'UPDATE_COMPLETE';
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
    (status) => status === STATUS_UPDATE_COMPLETE,
    RETRY_CONFIG,
    (status) => status.includes(STATUS_FAILED),
  );
}

async function executeStep2(cwd: string, commands: string[]) {
  await executeCommand(commands[0], cwd);
  await retry(
    () => assertStepCompletion(commands[1]),
    (status) => status === STATUS_UPDATE_COMPLETE,
    RETRY_CONFIG,
    (status) => status.includes(STATUS_FAILED),
  );
}

async function executeStep3(cwd: string, commands: string[], bucketName: string) {
  envVariable.set('BUCKET_NAME', bucketName);
  await executeCommand(commands[0], cwd);
  await executeCommand(commands[1], cwd);
  const stackRefactorId = await executeCreateStackRefactorCallCommand(commands[2], cwd);
  envVariable.set('STACK_REFACTOR_ID', stackRefactorId);
  await retry(
    () => assertRefactorStepCompletion(commands[4]),
    (processResult) => processResult.ExecutionStatus === STATUS_AVAILABLE || processResult.ExecutionStatus === STATUS_EXECUTE_COMPLETE,
    RETRY_CONFIG,
    (processResult) => processResult.Status.includes(STATUS_FAILED),
  );
  await executeCommand(commands[5], cwd);
  await retry(
    () => assertRefactorStepCompletion(commands[6]),
    (processResult) => processResult.ExecutionStatus === STATUS_AVAILABLE || processResult.ExecutionStatus === STATUS_EXECUTE_COMPLETE,
    RETRY_CONFIG,
    (processResult) => processResult.Status.includes(STATUS_FAILED),
  );
  envVariable.delete('BUCKET_NAME');
  envVariable.delete('STACK_REFACTOR_ID');
}

async function assertStepCompletion(command: string) {
  const processResult = JSON.parse(await executeCommand(command));
  return processResult.Stacks[0].StackStatus;
}

async function assertRefactorStepCompletion(command: string) {
  const processResult = JSON.parse(await executeCommand(command));
  return processResult;
}

async function takeTemplateSnapshot(projectRoot: string, category: RefactorCategory, templateName: string) {
  const templateFilePath = path.join(projectRoot, '.amplify', 'migration', 'templates', category, templateName);
  const templateFileContent = readJsonFile(templateFilePath);
  return templateFileContent;
}

export async function executeStackRefactorSteps(projRoot: string, category: RefactorCategory, bucketName: string) {
  const readmeContent = readMigrationReadmeFile(projRoot, category);
  const { step1Commands, step2commands, step3Commands } = getStackRefactorCommandsFromReadme(readmeContent);
  await executeStep1(projRoot, step1Commands);
  await executeStep2(projRoot, step2commands);
  await executeStep3(projRoot, step3Commands, bucketName);
}

export async function stackRefactor(projRoot: string, projName: string, category: RefactorCategory, bucketName: string) {
  const { gen1ResourceIds, gen1ResourceDetails } = await getGen1ResourceDetails(projRoot, category);

  // Remove properties that can safely differ between Gen1 and Gen2
  // This ensures accurate comparison of resources
  removeProperties(gen1ResourceDetails, ['CorsConfiguration.CorsRules[0].Id', 'Tags']);

  await executeStackRefactorSteps(projRoot, category, bucketName);

  if (category === 'storage') await uncommentS3BucketLineFromBackendFile(projRoot);

  await runGen2SandboxCommand(projRoot, projName);

  const { gen2ResourceIds, gen2ResourceDetails } = await getGen2ResourceDetails(projRoot, category);

  // Remove tags from Gen2 resources to ensure accurate comparison
  // Tags can differ due to sandbox environment but don't affect functionality
  removeProperties(gen2ResourceDetails, ['Tags']);

  assert.deepEqual(gen1ResourceIds, gen2ResourceIds);
  assert.deepEqual(gen1ResourceDetails, gen2ResourceDetails);
}

export async function rollbackStackRefactor(projRoot: string, category: RefactorCategory, bucketName: string) {
  const sourceTemplateBeforeStackRefactor = await takeTemplateSnapshot(projRoot, category, 'step3-sourceTemplate.json');
  const destinationTemplateBeforeStackRefactor = await takeTemplateSnapshot(projRoot, category, 'step3-destinationTemplate.json');

  const readmeContent = readMigrationReadmeFile(projRoot, category);
  const { step1RollbackCommands, step2RollbackCommands, step3RollbackCommands } = getRollbackCommandsFromReadme(readmeContent);

  await executeStep3(projRoot, step3RollbackCommands, bucketName);
  await executeStep2(projRoot, step2RollbackCommands);
  await executeStep1(projRoot, step1RollbackCommands);

  const sourceTemplateAfterStackRefactor = await takeTemplateSnapshot(projRoot, 'storage', 'step3-sourceTemplate.json');
  const destinationTemplateAfterStackRefactor = await takeTemplateSnapshot(projRoot, 'storage', 'step3-destinationTemplate.json');

  assert.deepStrictEqual(sourceTemplateBeforeStackRefactor, sourceTemplateAfterStackRefactor);
  assert.deepStrictEqual(destinationTemplateBeforeStackRefactor, destinationTemplateAfterStackRefactor);
}
