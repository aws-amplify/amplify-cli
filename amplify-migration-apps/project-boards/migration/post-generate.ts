#!/usr/bin/env npx ts-node
/**
 * Post-generate script for project-boards app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update branchName in amplify/data/resource.ts to "sandbox" (Gen2 hardcodes
 *    sandbox deployments to look for branchName='sandbox' in the mappings)
 * 2. Convert quotegenerator function from CommonJS to ESM
 * 3. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 4. Fix missing awsRegion in GraphQL API userPoolConfig
 */

import fs from 'fs/promises';
import path from 'path';

async function updateBranchName(appPath: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'data', 'resource.ts');

  const content = await fs.readFile(resourcePath, 'utf-8');

  // For sandbox deployments, Gen2 hardcodes the branch lookup to 'sandbox'
  // See: https://github.com/aws-amplify/amplify-backend/blob/main/packages/backend-data/src/factory.ts
  // The code does: isSandboxDeployment ? 'sandbox' : scope.node.tryGetContext(CDKContextKey.BACKEND_NAME)
  // So we must use 'sandbox' as the branchName in migratedAmplifyGen1DynamoDbTableMappings
  const targetBranch = 'sandbox';

  // The generated code has branchName set to the env name (e.g., 'ippj')
  // We need to change it to 'sandbox' for table reuse in sandbox deployments
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
  const [appPath] = process.argv.slice(2);
  await postGenerate(appPath)
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
