#!/usr/bin/env npx ts-node
/**
 * Post-generate script for discussions app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Convert fetchuseractivity function from CommonJS to ESM
 * 3. Convert recorduseractivity function from CommonJS to ESM
 * 4. Update frontend import from aws-exports to amplify_outputs.json
 */

import fs from 'fs/promises';
import path from 'path';

interface PostGenerateOptions {
  appPath: string;
  envName?: string;
}

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  console.log(`Updating branchName in ${resourcePath}...`);

  let content: string;
  try {
    content = await fs.readFile(resourcePath, 'utf-8');
  } catch {
    console.log('  resource.ts not found, skipping');
    return;
  }

  // For sandbox deployments, Gen2 hardcodes the branch lookup to 'sandbox'
  const targetBranch = 'sandbox';

  const branchNameMatch = content.match(/branchName:\s*['"]([^'"]+)['"]/);
  if (branchNameMatch) {
    console.log(`  Found branchName: '${branchNameMatch[1]}'`);
  } else {
    console.log('  WARNING: No branchName property found');
    return;
  }

  const updated = content.replace(/branchName:\s*['"]([^'"]+)['"]/, `branchName: '${targetBranch}'`);

  if (updated === content) {
    console.log('  No branchName found to update, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log(`  Updated branchName to "${targetBranch}"`);
}

async function convertFunctionToESM(appPath: string, functionName: string): Promise<void> {
  // Gen2 migration puts functions in amplify/function/ (singular)
  const handlerPath = path.join(appPath, 'amplify', 'function', functionName, 'index.js');

  console.log(`Converting ${functionName} to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

  // Convert exports.handler = async (event) => { to export async function handler(event) {
  let updated = content.replace(/exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  // Also handle module.exports pattern
  updated = updated.replace(/module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  if (updated === content) {
    console.log('  No CommonJS exports found, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM syntax');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.js');

  console.log(`Updating frontend config import in ${mainPath}...`);

  let content: string;
  try {
    content = await fs.readFile(mainPath, 'utf-8');
  } catch {
    console.log('  main.js not found, skipping');
    return;
  }

  // Change: import awsconfig from './aws-exports';
  // To: import awsconfig from '../amplify_outputs.json';
  const updated = content.replace(/from\s*["']\.\/aws-exports["']/g, "from '../amplify_outputs.json'");

  if (updated === content) {
    console.log('  No aws-exports import found, skipping');
    return;
  }

  await fs.writeFile(mainPath, updated, 'utf-8');
  console.log('  Updated import to amplify_outputs.json');
}

export async function postGenerate(options: PostGenerateOptions): Promise<void> {
  const { appPath } = options;

  console.log(`Running post-generate for discussions at ${appPath}`);
  console.log('');

  await updateBranchName(appPath);
  await convertFunctionToESM(appPath, 'fetchuseractivity');
  await convertFunctionToESM(appPath, 'recorduseractivity');
  await updateFrontendConfig(appPath);

  console.log('');
  console.log('Post-generate completed');
}

// CLI entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'main';

  postGenerate({ appPath, envName }).catch((error) => {
    console.error('Post-generate failed:', error);
    process.exit(1);
  });
}
