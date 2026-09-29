#!/usr/bin/env npx ts-node
/**
 * Post-generate script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to the value of AWS_BRANCH
 *    env var, or the current git branch if AWS_BRANCH is not set
 * 2. Convert lowstockproducts function from CommonJS to ESM
 * 3. Replace fetchSecret() with process.env in lowstockproducts
 * 4. Update lowstockproducts/resource.ts to use secret() instead of hardcoded SSM path
 * 5. Convert S3Trigger function from CommonJS to ESM
 * 6. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 */

import { execSync } from 'child_process';
import fs from 'fs/promises';
import fsSync from 'fs';
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

async function convertLowstockproductsToESM(appPath: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'index.js');
  const content = await fs.readFile(handlerPath, 'utf-8');

  let updated = content.replace(/exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  updated = updated.replace(/module\.exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g, 'export async function handler($1) {');

  // Replace fetchSecret() call with process.env lookup
  updated = updated.replace(
    /const\s+secretValue\s*=\s*await\s+fetchSecret\(\);?/g,
    "const secretValue = process.env['PRODUCT_CATALOG_SECRET'];",
  );

  await fs.writeFile(handlerPath, updated, 'utf-8');
}

async function updateLowstockproductsResource(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'resource.ts');
  const content = await fs.readFile(resourcePath, 'utf-8');

  // Add secret to the import from @aws-amplify/backend
  let updated = content.replace(
    /import\s*\{\s*defineFunction\s*\}\s*from\s*["']@aws-amplify\/backend["']/,
    'import { defineFunction, secret } from "@aws-amplify/backend"',
  );

  // Replace hardcoded SSM path with secret()
  updated = updated.replace(/PRODUCT_CATALOG_SECRET:\s*["'][^"']+["']/, 'PRODUCT_CATALOG_SECRET: secret("PRODUCT_CATALOG_SECRET")');

  await fs.writeFile(resourcePath, updated, 'utf-8');
}

async function convertS3TriggerToESM(appPath: string): Promise<void> {
  const functionDir = path.join(appPath, 'amplify', 'function');
  const entries = fsSync.readdirSync(functionDir);
  const triggerDirs = entries.filter((e) => e.startsWith('S3Trigger'));

  for (const dir of triggerDirs) {
    const handlerPath = path.join(functionDir, dir, 'index.js');
    if (!fsSync.existsSync(handlerPath)) continue;

    const content = await fs.readFile(handlerPath, 'utf-8');

    let updated = content.replace(
      /exports\.handler\s*=\s*async\s*(function\s*)?\((\w*)\)\s*=>\s*\{/g,
      'export async function handler($2) {',
    );

    updated = updated.replace(/exports\.handler\s*=\s*async\s+function\s*\((\w*)\)\s*\{/g, 'export async function handler($1) {');

    await fs.writeFile(handlerPath, updated, 'utf-8');
  }
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');
  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(/from\s*["']\.\/amplifyconfiguration\.json["']/g, "from '../amplify_outputs.json'");

  await fs.writeFile(mainPath, updated, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  await updateBranchName(appPath);
  await convertLowstockproductsToESM(appPath);
  await updateLowstockproductsResource(appPath);
  await convertS3TriggerToESM(appPath);
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
