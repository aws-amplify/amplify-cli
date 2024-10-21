import execa from 'execa';
import path from 'node:path';
import * as fs from 'fs-extra';
import { getNpxPath, retry } from '@aws-amplify/amplify-e2e-core';
import { runGen2SandboxCommand } from '.';

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

function uncommentBucketNameLineFromBackendFile(projRoot: string) {
  const backendFilePath = path.join(projRoot, 'amplify', 'backend.ts');
  const backendFileContent = fs.readFileSync(backendFilePath, 'utf8');
  const regex = /^\s*\/\/\s*(s3Bucket\.bucketName)/m;
  const updatedBackendFileContent = backendFileContent.replace(regex, '$1');
  fs.writeFileSync(backendFilePath, updatedBackendFileContent);
}

function setEnvVariable(name: string, value: string) {
  process.env[name] = value;
}

function extractContent(readmeContent: string, startRegex: string, endRegex: string) {
  const pattern = new RegExp(`${startRegex}([\\s\\S]*?)${endRegex}`, 'i');
  const match = readmeContent.match(pattern);

  if (match && match[1]) {
    return match[1].trim();
  }
  throw new Error('README file parsing failed to get the stack refactor commands');
}

function extractCommands(readmeContent: string) {
  const pattern = /```([\s\S]*?)```/g;
  const matches = readmeContent.matchAll(pattern);
  const commands = [];

  for (const match of matches) {
    if (match[1]) {
      commands.push(match[1].trim());
    }
  }
  if (commands.length === 0) {
    throw new Error('README file parsing failed to get the stack refactor commands');
  }
  return commands;
}

function getCommandsFromReadme(readmeContent: string) {
  const step1Content = extractContent(readmeContent, '### STEP 1', '#### Rollback step');
  const step2Content = extractContent(readmeContent, '### STEP 2', '#### Rollback step');
  const step3Content = extractContent(readmeContent, '### STEP 3', '#### Rollback step');
  const step1Commands = extractCommands(step1Content);
  const step2commands = extractCommands(step2Content);
  const step3Commands = extractCommands(step3Content);
  return { step1Commands, step2commands, step3Commands };
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

async function assertStepCompletion(command: string) {
  const processResult = JSON.parse(await executeCommand(command));
  return processResult.Stacks[0].StackStatus;
}

async function assertRefactorStepCompletion(command: string) {
  const processResult = JSON.parse(await executeCommand(command));
  return processResult.Status;
}

async function executeStep1(cwd: string, commands: string[]) {
  await executeCommand(commands[0], cwd);
  await retry(
    () => assertStepCompletion(commands[1]),
    (status) => status.includes('COMPLETE') && !status.includes('IN_PROGRESS'),
    {
      times: 50,
      delayMS: 1000, // 1 second
      timeoutMS: 1000 * 60 * 5, // 5 minutes
    },
    (status) => status.includes('FAILED'),
  );
}

async function executeStep2(cwd: string, commands: string[]) {
  await executeCommand(commands[0], cwd);
  await retry(
    () => assertStepCompletion(commands[1]),
    (status) => status.includes('COMPLETE') && !status.includes('IN_PROGRESS'),
    {
      times: 50,
      delayMS: 1000, // 1 second
      timeoutMS: 1000 * 60 * 5, // 5 minutes
    },
    (status) => status.includes('FAILED'),
  );
}

async function executeStep3(cwd: string, commands: string[], bucketName: string) {
  setEnvVariable('BUCKET_NAME', bucketName);
  await executeCommand(commands[1], cwd);
  await executeCommand(commands[2], cwd);
  const stackRefactorId = await executeCreateStackRefactorCallCommand(commands[3], cwd);
  setEnvVariable('STACK_REFACTOR_ID', stackRefactorId);
  await retry(
    () => assertRefactorStepCompletion(commands[5]),
    (status) => status.includes('COMPLETE') && !status.includes('IN_PROGRESS'),
    {
      times: 50,
      delayMS: 1000, // 1 second
      timeoutMS: 1000 * 60 * 5, // 5 minutes
    },
    (status) => status.includes('FAILED'),
  );
  await executeCommand(commands[6], cwd);
  await retry(
    () => assertRefactorStepCompletion(commands[7]),
    (status) => status.includes('COMPLETE') && !status.includes('IN_PROGRESS'),
    {
      times: 50,
      delayMS: 1000, // 1 second
      timeoutMS: 1000 * 60 * 5, // 5 minutes
    },
    (status) => status.includes('FAILED'),
  );
}

export async function stackRefactor(projRoot: string, category: string, bucketName: string) {
  const readmeFilePath = path.join(projRoot, '.amplify', 'migration', 'templates', category, 'MIGRATION_README.md');
  const readmeContent = fs.readFileSync(readmeFilePath, 'utf-8');
  const { step1Commands, step2commands, step3Commands } = getCommandsFromReadme(readmeContent);

  await executeStep1(projRoot, step1Commands);
  await executeStep2(projRoot, step2commands);
  await executeStep3(projRoot, step3Commands, bucketName);

  if (category == 'storage') {
    await uncommentBucketNameLineFromBackendFile(projRoot);
  }

  await runGen2SandboxCommand(projRoot);
}
