#!/usr/bin/env npx ts-node
/**
 * Post-generate script for mood-board app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert moodboardGetRandomEmoji function from CommonJS to ESM
 * 3. Convert moodboardKinesisReader function from CommonJS to ESM
 * 4. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 5. Update SurpriseMeButton stream name to use gen2 prefix
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

function resolveTargetBranch(): string {
  if (process.env.AWS_BRANCH) {
    return process.env.AWS_BRANCH;
  }
  return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8' }).trim();
}

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = resolveTargetBranch();

  const updated = content.replace(/branchName:\s*['"]([^'"]+)['"]/, `branchName: '${targetBranch}'`);

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertFunctionToESM(appPath: string, functionName: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', functionName, 'index.js');

  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(/exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  updated = updated.replace(/module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');

  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(/from\s*["']\.\/amplifyconfiguration\.json["']/g, "from '../amplify_outputs.json'");

  await fs.writeFile(mainPath, updated, 'utf-8');
}

async function updateSurpriseMeStreamName(appPath: string, envName: string): Promise<void> {
  const constantsPath = path.join(appPath, 'src', 'constants.ts');

  const content = await fs.readFile(constantsPath, 'utf-8');

  const gen2StreamName = `moodboardKinesis-gen2-${envName}`;
  const updated = content.replace(
    /export const KINESIS_STREAM_NAME\s*=\s*['"][^'"]+['"]/,
    `export const KINESIS_STREAM_NAME = '${gen2StreamName}'`,
  );

  await fs.writeFile(constantsPath, updated, 'utf-8');
}

export async function postGenerate(appPath: string, envName: string): Promise<void> {
  await updateBranchName(appPath);
  await convertFunctionToESM(appPath, 'moodboardGetRandomEmoji');
  await convertFunctionToESM(appPath, 'moodboardKinesisReader');
  await convertFunctionToESM(appPath, 'moodboardKinesisTrigger');
  await updateFrontendConfig(appPath);
  await updateSurpriseMeStreamName(appPath, envName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  if (!process.env.GEN1_ENV_NAME) {
    throw new Error(`Missing GEN1_ENV_NAME env variable`);
  }
  await postGenerate(appPath, process.env.GEN1_ENV_NAME);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
