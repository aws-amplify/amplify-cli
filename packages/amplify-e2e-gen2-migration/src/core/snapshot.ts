#!/usr/bin/env npx tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import {
  CloudFormationClient,
  DescribeStacksCommand,
  GetTemplateCommand,
  paginateListStackResources,
} from '@aws-sdk/client-cloudformation';

export const REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY = '.amplify/gen2-migration/refactor.operations';

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

function copySync(src: string, dest: string): void {
  if (fs.existsSync(dest)) {
    fs.rmSync(dest, { recursive: true });
  }
  console.log(dest);
  fs.copySync(src, dest, { filter: (src) => !src.includes('node_modules') });
}

function copyRequired(srcBasePath: string, destBasePath: string, toCopy: readonly string[]): void {
  for (const required of toCopy) {
    const inputPath = path.join(srcBasePath, required);
    if (!fs.existsSync(inputPath)) {
      throw new Error(`Required input not found: ${inputPath}`);
    }
    const destPath = path.join(destBasePath, required);
    copySync(inputPath, destPath);
  }
}

function copyOptional(srcBasePath: string, destBasePath: string, toCopy: readonly string[]): void {
  for (const optional of toCopy) {
    const inputPath = path.join(srcBasePath, optional);
    const destPath = path.join(destBasePath, optional);
    if (fs.existsSync(inputPath)) {
      copySync(inputPath, destPath);
    }
  }
}

// ---------------------------------------------------------------------------
// CloudFormation helpers (refactor.input only)
// ---------------------------------------------------------------------------

async function fetchTemplate(cfnClient: CloudFormationClient, stackName: string): Promise<string> {
  const response = await cfnClient.send(new GetTemplateCommand({ StackName: stackName, TemplateStage: 'Original' }));
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return response.TemplateBody!;
}

async function fetchNestedStacks(cfnClient: CloudFormationClient, stackName: string): Promise<readonly string[]> {
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

async function downloadRecursive(cfnClient: CloudFormationClient, stackNameOrArn: string, targetDir: string): Promise<void> {
  const stackName = stackNameFromArn(stackNameOrArn);

  const template = await fetchTemplate(cfnClient, stackName);
  writeFileSync(path.join(targetDir, `${stackName}.template.json`), JSON.stringify(JSON.parse(template), null, 2));

  const stackResponse = await cfnClient.send(new DescribeStacksCommand({ StackName: stackName }));
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const stack = stackResponse.Stacks![0];

  const outputs = stack.Outputs ?? [];
  writeFileSync(path.join(targetDir, `${stackName}.outputs.json`), JSON.stringify(outputs, null, 2));

  const parameters = stack.Parameters ?? [];
  writeFileSync(path.join(targetDir, `${stackName}.parameters.json`), JSON.stringify(parameters, null, 2));

  const description = stack.Description ?? '';
  writeFileSync(path.join(targetDir, `${stackName}.description.txt`), description);

  const nestedIds = await fetchNestedStacks(cfnClient, stackName);
  for (const nestedId of nestedIds) {
    await downloadRecursive(cfnClient, nestedId, targetDir);
  }
}

// ---------------------------------------------------------------------------
// Snapshot capture functions
// ---------------------------------------------------------------------------

/**
 * Downloads Gen1 and Gen2 CloudFormation templates into `_snapshot.pre.refactor/`.
 */
export async function capturePreRefactor(
  gen1RootStackName: string,
  gen2RootStackName: string,
  targetDir: string,
  clientConfig: ConstructorParameters<typeof CloudFormationClient>[0] = {},
): Promise<void> {
  const destPath = path.join(targetDir, '_snapshot.pre.refactor');
  resetDir(destPath);

  const cfnClient = new CloudFormationClient(clientConfig);
  await downloadRecursive(cfnClient, gen2RootStackName, destPath);
  await downloadRecursive(cfnClient, gen1RootStackName, destPath);
}

/**
 * Copies refactor operations into `_snapshot.post.refactor/`.
 */
export async function capturePostRefactor(deployedAppPath: string, dstBasePath: string): Promise<void> {
  const srcBasePath = path.join(deployedAppPath, REFACTOR_SNAPSHOT_OUTPUT_DIRECTORY);
  const destPath = path.join(dstBasePath, '_snapshot.post.refactor');
  resetDir(destPath);
  copySync(srcBasePath, destPath);
}

/**
 * Copies the Gen1 app state into `_snapshot.pre.generate/`.
 */
export async function capturePreGenerate(deployedAppPath: string, dstBasePath: string): Promise<void> {
  const destPath = path.join(dstBasePath, '_snapshot.pre.generate');
  resetDir(destPath);

  copyRequired(deployedAppPath, destPath, ['amplify', '.gitignore']);
  copyOptional(deployedAppPath, destPath, ['package.json']);

  // For the snapshot we want to include all files
  const gitIgnorePath = path.join(destPath, '.gitignore');
  const gitIgnore = fs.readFileSync(gitIgnorePath, { encoding: 'utf-8' });
  const newGitIgnore = gitIgnore
    .replaceAll('amplify/', '!amplify/')
    .replaceAll('build/', '!build/')
    .replaceAll('!amplify/.config/local-*', 'amplify/.config/local-*');
  fs.writeFileSync(gitIgnorePath, newGitIgnore);
}

/**
 * Copies the Gen2 output into `_snapshot.post.generate/`.
 */
export async function capturePostGenerate(deployedAppPath: string, dstBasePath: string): Promise<void> {
  const destPath = path.join(dstBasePath, '_snapshot.post.generate');
  resetDir(destPath);

  copyRequired(deployedAppPath, destPath, ['amplify', '.gitignore', 'amplify.yml']);
  copyOptional(deployedAppPath, destPath, ['package.json']);
}
