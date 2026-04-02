#!/usr/bin/env npx ts-node
/**
 * Post-generate script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Convert lowstockproducts function from CommonJS to ESM + update secret fetching
 * 2. Convert S3 trigger function from CommonJS to ESM
 * 3. Update lowstockproducts/resource.ts to use secret() for PRODUCT_CATALOG_SECRET
 * 4. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 */

import fs from 'fs/promises';
import path from 'path';

interface PostGenerateOptions {
  appPath: string;
  envName?: string;
}

async function convertLowStockToESM(appPath: string): Promise<void> {
  const handlerPath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'index.js');

  console.log(`Converting lowstockproducts to ESM in ${handlerPath}...`);

  let content: string;
  try {
    content = await fs.readFile(handlerPath, 'utf-8');
  } catch {
    console.log('  index.js not found, skipping');
    return;
  }

  // Convert exports.handler to ESM export
  let updated = content.replace(
    /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
    'export async function handler($1) {',
  );

  // Replace SSM secret fetching with env var read:
  // const secretValue = await fetchSecret();
  // becomes:
  // const secretValue = process.env['PRODUCT_CATALOG_SECRET'];
  updated = updated.replace(
    /const secretValue = await fetchSecret\(\);/g,
    "const secretValue = process.env['PRODUCT_CATALOG_SECRET'];",
  );

  if (updated === content) {
    console.log('  No changes needed, skipping');
    return;
  }

  await fs.writeFile(handlerPath, updated, 'utf-8');
  console.log('  Converted to ESM and updated secret fetching');
}

async function convertS3TriggerToESM(appPath: string): Promise<void> {
  // Find the S3 trigger function directory (name varies per deployment)
  const storagePath = path.join(appPath, 'amplify', 'storage');

  let triggerDirs: string[];
  try {
    const entries = await fs.readdir(storagePath, { withFileTypes: true });
    triggerDirs = entries
      .filter((e) => e.isDirectory() && e.name.startsWith('S3Trigger'))
      .map((e) => e.name);
  } catch {
    console.log('  amplify/storage/ not found, skipping');
    return;
  }

  for (const triggerDir of triggerDirs) {
    const handlerPath = path.join(storagePath, triggerDir, 'index.js');

    console.log(`Converting ${triggerDir} to ESM in ${handlerPath}...`);

    let content: string;
    try {
      content = await fs.readFile(handlerPath, 'utf-8');
    } catch {
      console.log('  index.js not found, skipping');
      continue;
    }

    // Convert exports.handler = async function (event) { to export async function handler(event) {
    let updated = content.replace(
      /exports\.handler\s*=\s*async\s*function\s*\((\w*)\)\s*\{/g,
      'export async function handler($1) {',
    );

    // Also handle arrow function pattern
    updated = updated.replace(
      /exports\.handler\s*=\s*async\s*\((\w*)\)\s*=>\s*\{/g,
      'export async function handler($1) {',
    );

    if (updated === content) {
      console.log('  No CommonJS exports found, skipping');
      continue;
    }

    await fs.writeFile(handlerPath, updated, 'utf-8');
    console.log('  Converted to ESM syntax');
  }
}


async function updateLowStockResourceTs(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', 'lowstockproducts', 'resource.ts');

  console.log(`Updating lowstockproducts/resource.ts to use secret()...`);

  let content: string;
  try {
    content = await fs.readFile(resourcePath, 'utf-8');
  } catch {
    console.log('  resource.ts not found, skipping');
    return;
  }

  // Add secret import if not present
  let updated = content.replace(
    /import \{ defineFunction \} from ["']@aws-amplify\/backend["'];/,
    'import { defineFunction, secret } from "@aws-amplify/backend";',
  );

  // Replace the SSM path with secret() call
  // The generated code has something like:
  //   PRODUCT_CATALOG_SECRET: "/amplify/..."
  // Replace with:
  //   PRODUCT_CATALOG_SECRET: secret("PRODUCT_CATALOG_SECRET")
  updated = updated.replace(
    /PRODUCT_CATALOG_SECRET:\s*\n?\s*['"][^'"]+['"]/,
    'PRODUCT_CATALOG_SECRET: secret("PRODUCT_CATALOG_SECRET")',
  );

  if (updated === content) {
    console.log('  No changes needed, skipping');
    return;
  }

  await fs.writeFile(resourcePath, updated, 'utf-8');
  console.log('  Updated to use secret()');
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

  // Change: import amplifyconfig from './amplifyconfiguration.json';
  // To: import amplifyconfig from '../amplify_outputs.json';
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
  const { appPath } = options;

  console.log(`Running post-generate for product-catalog at ${appPath}`);
  console.log('');

  await convertLowStockToESM(appPath);
  await convertS3TriggerToESM(appPath);
  await updateLowStockResourceTs(appPath);
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
