#!/usr/bin/env npx tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import { AmplifyClient, paginateListApps, App } from '@aws-sdk/client-amplify';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  GetTemplateCommand,
  StackStatus,
  paginateListStackResources,
  paginateListStacks,
} from '@aws-sdk/client-cloudformation';

const STEPS = ['pre.generate', 'post.generate', 'pre.refactor', 'post.refactor'] as const;
type Step = (typeof STEPS)[number];

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function resetDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmdirSync(dir, { recursive: true });
  }
  fs.mkdirSync(dir, { recursive: true });
}

function writeFileSync(p: string, content: string): void {
  console.log(p);
  fs.writeFileSync(p, content, 'utf-8');
}

async function copySync(src: string, dest: string): Promise<void> {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  console.log(dest);
  fs.copySync(src, dest, { recursive: true });
}

async function copyRequired(srcBasePath: string, destBasePath: string, toCopy: readonly string[]): Promise<void> {
  for (const required of toCopy) {
    const inputPath = path.join(srcBasePath, required);
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Required input not found: ${inputPath}`);
    }
    const destPath = path.join(destBasePath, required);
    await copySync(inputPath, destPath);
  }
}

async function copyOptional(srcBasePath: string, destBasePath: string, toCopy: readonly string[]): Promise<void> {
  for (const optional of toCopy) {
    const inputPath = path.join(srcBasePath, optional);
    const destPath = path.join(destBasePath, optional);
    if (fs.existsSync(inputPath)) {
      await copySync(inputPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------
// Amplify helpers
// ---------------------------------------------------------------------------

const amplifyClient = new AmplifyClient({});

async function findAppByName(appName: string): Promise<App> {
  for await (const page of paginateListApps({ client: amplifyClient }, { maxResults: 25 })) {
    const match = page.apps?.find((app) => app.name === appName);
    if (match) {
      return match;
    }
  }
  throw new Error(`Amplify app "${appName}" not found`);
}

// ---------------------------------------------------------------------------
// CloudFormation helpers (refactor.input only)
// ---------------------------------------------------------------------------

const cfnClient = new CloudFormationClient({});

const ACTIVE_STATUSES = [StackStatus.CREATE_COMPLETE, StackStatus.UPDATE_COMPLETE, StackStatus.UPDATE_ROLLBACK_COMPLETE];

async function findStackByPattern(pattern: RegExp): Promise<string> {
  for await (const page of paginateListStacks({ client: cfnClient }, { StackStatusFilter: ACTIVE_STATUSES })) {
    const match = page.StackSummaries?.find((s) => s.StackName && pattern.test(s.StackName));
    if (match?.StackName) return match.StackName;
  }
  throw new Error(`No stack found matching pattern "${pattern.source}"`);
}

async function findGen2RootStack(appId: string, branchName: string): Promise<string> {
  const branchNoDashes = branchName.replace(/-/g, '');
  const rootPattern = new RegExp(`^amplify-${appId}-${branchNoDashes}-branch-[0-9a-f]{10}$`);
  return findStackByPattern(rootPattern);
}

async function findGen1RootStack(appName: string, envName: string): Promise<string> {
  const rootPattern = new RegExp(`^amplify-${appName}-${envName}-[0-9a-f]{5}$`);
  return findStackByPattern(rootPattern);
}

async function fetchTemplate(stackName: string): Promise<string> {
  const response = await cfnClient.send(new GetTemplateCommand({ StackName: stackName }));
  return response.TemplateBody!;
}

async function fetchNestedStacks(stackName: string): Promise<readonly string[]> {
  const ids: string[] = [];
  for await (const page of paginateListStackResources({ client: cfnClient }, { StackName: stackName })) {
    for (const r of page.StackResourceSummaries ?? []) {
      if (r.ResourceType === 'AWS::CloudFormation::Stack' && r.PhysicalResourceId) {
        ids.push(r.PhysicalResourceId);
      }
    }
  }
  return ids;
}

function stackNameFromArn(arnOrName: string): string {
  if (arnOrName.startsWith('arn:')) {
    const parts = arnOrName.split('/');
    return parts[1] ?? arnOrName;
  }
  return arnOrName;
}

async function downloadRecursive(stackNameOrArn: string, targetDir: string, appId: string, appName: string): Promise<void> {
  const stackName = stackNameFromArn(stackNameOrArn);

  const template = await fetchTemplate(stackName);
  writeFileSync(path.join(targetDir, `${stackName}.template.json`), JSON.stringify(JSON.parse(template), null, 2));

  const stackResponse = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
  const stack = stackResponse.Stacks![0];

  const outputs = stack.Outputs ?? [];
  writeFileSync(path.join(targetDir, `${stackName}.outputs.json`), JSON.stringify(outputs, null, 2));

  const parameters = stack.Parameters ?? [];
  writeFileSync(path.join(targetDir, `${stackName}.parameters.json`), JSON.stringify(parameters, null, 2));

  const description = stack.Description ?? '';
  writeFileSync(path.join(targetDir, `${stackName}.description.txt`), description);

  const nestedIds = await fetchNestedStacks(stackName);
  for (const nestedId of nestedIds) {
    await downloadRecursive(nestedId, targetDir, appId, appName);
  }
}

// ---------------------------------------------------------------------------
// Snapshot capture functions
// ---------------------------------------------------------------------------

async function capturePreRefactor(appName: string, amplifyAppName?: string, gen2Branch?: string, gen1Env?: string): Promise<void> {
  const resolvedAppName = amplifyAppName ?? appName.replaceAll('-', '');
  const app = await findAppByName(resolvedAppName);
  const gen2RootStack = await findGen2RootStack(app.appId!, gen2Branch ?? 'gen2-main');
  const gen1RootStack = await findGen1RootStack(app.name!, gen1Env ?? 'main');

  const targetDir = path.resolve(path.join(__dirname, appName, '_snapshot.pre.refactor'));
  resetDir(targetDir);

  await downloadRecursive(gen2RootStack, targetDir, app.appId!, app.name!);
  await downloadRecursive(gen1RootStack, targetDir, app.appId!, app.name!);
}

async function capturePostRefactor(appName: string, deployedAppPath: string): Promise<void> {
  const srcBasePath = path.join(deployedAppPath, '.amplify/refactor.operations');
  const dstBasePath = path.join(__dirname, appName, '_snapshot.post.refactor');
  resetDir(dstBasePath);
  copySync(srcBasePath, dstBasePath);
}

async function capturePreGenerate(appName: string, deployedAppPath: string): Promise<void> {
  const dstBasePath = path.join(__dirname, appName, '_snapshot.pre.generate');
  resetDir(dstBasePath);

  await copyRequired(deployedAppPath, dstBasePath, ['amplify', '.gitignore']);
  await copyOptional(deployedAppPath, dstBasePath, ['package.json']);

  // For the snapshot we want to include all files
  const gitIgnorePath = path.join(dstBasePath, '.gitignore');
  const gitIgnore = fs.readFileSync(gitIgnorePath, { encoding: 'utf-8' });
  const newGitIgnore = gitIgnore
    .replaceAll('amplify/', '!amplify/')
    .replaceAll('build/', '!build/')
    .replaceAll('!amplify/.config/local-*', 'amplify/.config/local-*');
  fs.writeFileSync(gitIgnorePath, newGitIgnore);
}

async function capturePostGenerate(appName: string, deployedAppPath: string): Promise<void> {
  const dstBasePath = path.join(__dirname, appName, '_snapshot.post.generate');
  resetDir(dstBasePath);

  await copyRequired(deployedAppPath, dstBasePath, ['amplify', '.gitignore', 'amplify.yml']);
  await copyOptional(deployedAppPath, dstBasePath, ['package.json']);
}

// ---------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------

function usage(): never {
  console.error(`Usage: npx tsx snapshot.ts <step> <app-name> [deployed-app-path] [amplify-app-name] [gen2-branch] [gen1-env]

Steps: ${STEPS.join(', ')}

  app-name:          Directory name under amplify-migration-apps/
  deployed-app-path: Path to the deployed app (required for pre/post.generate and post.refactor)
  amplify-app-name:  Actual Amplify app name if different from app-name (default: app-name without dashes)
  gen2-branch:       Gen2 branch name (default: gen2-main)
  gen1-env:          Gen1 environment name (default: main)`);

  process.exit(1);
}

async function main(): Promise<void> {
  const [snapshot, appName, deployedAppPath, amplifyAppName, gen2Branch, gen1Env] = process.argv.slice(2);

  if (!snapshot || !STEPS.includes(snapshot as Step) || !appName) {
    usage();
  }

  switch (snapshot as Step) {
    case 'pre.generate':
      if (!deployedAppPath) usage();
      await capturePreGenerate(appName, deployedAppPath);
      break;
    case 'post.generate':
      if (!deployedAppPath) usage();
      await capturePostGenerate(appName, deployedAppPath);
      break;
    case 'pre.refactor':
      await capturePreRefactor(appName, amplifyAppName, gen2Branch, gen1Env);
      break;
    case 'post.refactor':
      if (!deployedAppPath) usage();
      await capturePostRefactor(appName, deployedAppPath);
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
