#!/usr/bin/env npx ts-node
/**
 * Post-generate script for project-boards app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "gen2-main"
 * 2. Convert quotegenerator function from CommonJS to ESM
 * 3. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 */

import fs from 'fs/promises';
import path from 'path';

interface PostGenerateOptions {
  appPath: string;
  envName?: string;
}

async function updateBranchName(appPath: string, envName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  console.log(`Updating branchName in ${resourcePath}...`);

  const content = await fs.readFile(resourcePath, 'utf-8');
  const targetBranch = `gen2-${envName}`;

  // The generated code has branchName set to the env name (e.g., 'ippj')
  // We need to change it to 'gen2-{envName}' for table reuse
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
  // Gen2 migration puts functions in amplify/function/ (singular)
  const handlerPath = path.join(appPath, 'amplify', 'function', 'quotegenerator', 'index.js');

  console.log(`Converting quotegenerator to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

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

  if (updated === content) {
    console.log('  No CommonJS exports found, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM syntax');
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');

  console.log(`Updating frontend config import in ${mainPath}...`);

  let content: string;
  try {
    content = await fs.readFile(mainPath, 'utf-8');
  } catch {
    console.log('  main.tsx not found, skipping');
    return;
  }

  const updated = content.replace(
    /from\s*["']\.\/amplifyconfiguration\.json["']/g,
    "from '../amplify_outputs.json'",
  );

  if (updated === content) {
    console.log('  No amplifyconfiguration.json import found, skipping');
    return;
  }

  await fs.writeFile(mainPath, updated, 'utf-8');
  console.log('  Updated import to amplify_outputs.json');
}

export async function postGenerate(options: PostGenerateOptions): Promise<void> {
  const { appPath, envName = 'main' } = options;

  console.log(`Running post-generate for project-boards at ${appPath}`);
  console.log('');

  await updateBranchName(appPath, envName);
  await convertQuotegeneratorToESM(appPath);
  await updateFrontendConfig(appPath);

  console.log('');
  console.log('Post-generate completed');
}

// CLI entry point - use import.meta.url for ESM compatibility
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'main';

  postGenerate({ appPath, envName }).catch((error) => {
    console.error('Post-generate failed:', error);
    process.exit(1);
  });
}
