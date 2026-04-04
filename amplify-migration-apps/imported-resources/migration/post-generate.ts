#!/usr/bin/env npx ts-node
/**
 * Post-generate script for imported-resources app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox"
 * 2. Convert quotegenerator function from CommonJS to ESM
 * 3. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 */

import fs from 'fs/promises';
import path from 'path';

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  const targetBranch = 'sandbox';

  const updated = content.replace(
    /branchName:\s*['"]([^'"]+)['"]/,
    `branchName: '${targetBranch}'`,
  );

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertQuotegeneratorToESM(appPath: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', 'quotegenerator', 'index.js');

  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  updated = updated.replace(
    /module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  await fs.writeFile(handlerPath, updated, 'utf-8');
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
  await updateFrontendConfig(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
