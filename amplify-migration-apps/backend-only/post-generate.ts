#!/usr/bin/env npx ts-node
/**
 * Post-generate script for backend-only app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Convert quotegeneratorbe function from CommonJS to ESM
 * 3. Fix missing awsRegion in GraphQL API userPoolConfig
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

  const targetBranch = 'sandbox';

  const branchNameMatch = content.match(/branchName:\s*['"]([^'"]+)['"]/);
  if (branchNameMatch) {
    console.log(`  Found branchName: '${branchNameMatch[1]}'`);
  } else {
    console.log('  WARNING: No branchName property found');
  }

  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: '${targetBranch}'`,
  );

  if (updated === content) {
    console.log('  No branchName found to update, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log(`  Updated branchName to "${targetBranch}"`);
}

async function convertQuotegeneratorToESM(appPath: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', 'quotegeneratorbe', 'index.js');

  console.log(`Converting quotegeneratorbe to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  updated = updated.replace(
    /module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  if (updated === content) {
    console.log('  No CommonJS exports found, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM syntax');
}

async function fixUserPoolRegionInGraphqlApi(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  console.log(`Fixing user pool region in GraphQL API config in ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  const updated = content.replace(
    /userPoolConfig:\s*\{\s*userPoolId:\s*backend\.auth\.resources\.userPool\.userPoolId,?\s*\}/g,
    `userPoolConfig: {
      userPoolId: backend.auth.resources.userPool.userPoolId,
      awsRegion: backend.auth.stack.region,
    }`,
  );

  if (updated === content) {
    console.log('  No userPoolConfig found to fix, skipping');
    return;
  }

  await fs.writeFile(backendPath, updated, 'utf-8');
  console.log('  Added awsRegion to userPoolConfig');
}

export async function postGenerate(options: PostGenerateOptions): Promise<void> {
  const { appPath } = options;

  console.log(`Running post-generate for backend-only at ${appPath}`);
  console.log('');

  await updateBranchName(appPath);
  await convertQuotegeneratorToESM(appPath);
  await fixUserPoolRegionInGraphqlApi(appPath);

  console.log('');
  console.log('Post-generate completed');
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'main';

  postGenerate({ appPath, envName }).catch((error) => {
    console.error('Post-generate failed:', error);
    process.exit(1);
  });
}
