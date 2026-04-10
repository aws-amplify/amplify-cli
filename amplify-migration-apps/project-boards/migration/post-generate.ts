#!/usr/bin/env npx ts-node
/**
 * Post-generate script for project-boards app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert quotegenerator function from CommonJS to ESM
 * 3. Convert PreTokenGeneration trigger function from CommonJS to ESM
 * 4. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 5. Fix missing awsRegion in GraphQL API userPoolConfig
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

  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: '${targetBranch}'`,
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertQuotegeneratorToESM(appPath: string): Promise<void> {
  // Gen2 migration puts functions in amplify/function/ (singular)
  const handlerPath = path.join(appPath, 'amplify', 'function', 'quotegenerator', 'index.js');

  const content = await fs.readFile(handlerPath, 'utf-8');

  // Convert exports.handler = async (event) => { to export async function handler(event) {
  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  // Also handle module.exports pattern
  updated = updated.replace(
    /module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function findPreTokenGenerationDir(appPath: string): Promise<string> {
  const authDir = path.join(appPath, 'amplify', 'auth');
  const entries = await fs.readdir(authDir);
  const match = entries.find((e) => e.startsWith('projectboards') && e.includes('PreTokenGeneration'));
  if (!match) throw new Error('PreTokenGeneration directory not found under amplify/auth/');
  return path.join(authDir, match);
}

async function convertPreTokenGenerationToESM(appPath: string): Promise<void> {
  const preTokenDir = await findPreTokenGenerationDir(appPath);

  // Convert index.js
  const indexPath = path.join(preTokenDir, 'index.js');
  let indexContent = await fs.readFile(indexPath, 'utf-8');

  // Replace dynamic require with static import
  indexContent = indexContent.replace(
    /const modules = moduleNames\.map\(\(name\) => require\(`\.\/\$\{name\}`\)\);/,
    "const modules = [await import('./alter-claims.js')];",
  );

  // exports.handler = async (event, context) => { → export async function handler(event, context) {
  indexContent = indexContent.replace(
    /exports\.handler\s*=\s*async\s*\((\w+(?:,\s*\w+)*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(indexPath, indexContent, 'utf-8');

  // Convert alter-claims.js
  const alterClaimsPath = path.join(preTokenDir, 'alter-claims.js');
  let alterClaimsContent = await fs.readFile(alterClaimsPath, 'utf-8');

  // exports.handler = async (event) => { → export async function handler(event) {
  alterClaimsContent = alterClaimsContent.replace(
    /exports\.handler\s*=\s*async\s*\((\w+)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(alterClaimsPath, alterClaimsContent, 'utf-8');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');

  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(
    /from\s*["']\.\/amplifyconfiguration\.json["']/g,
    "from '../amplify_outputs.json'",
  );

  await fs.writeFile(mainPath, updated, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertQuotegeneratorToESM(appPath);
  await convertPreTokenGenerationToESM(appPath);
  await updateFrontendConfig(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath)
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
