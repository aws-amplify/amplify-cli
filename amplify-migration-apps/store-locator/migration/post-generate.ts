#!/usr/bin/env npx ts-node
/**
 * Post-generate script for store-locator app.
 *
 * Applies manual edits required after `amplify gen2-migration generate`:
 * 1. Update frontend import from amplifyconfiguration.json to amplify_outputs.json
 * 2. Convert PostConfirmation trigger index.js from CommonJS to ESM
 * 3. Convert PostConfirmation trigger add-to-group.js from CommonJS to ESM
 * 4. Update PostConfirmation resource.ts (memoryMB, resourceGroupName)
 */

import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';

function findPostConfirmationDir(appPath: string): string {
  const functionDir = path.join(appPath, 'amplify', 'function');
  const entries = fsSync.readdirSync(functionDir);
  const match = entries.find((e) => e.includes('PostConfirmation'));
  if (!match) {
    throw new Error('Could not find PostConfirmation directory under amplify/function/');
  }
  return match;
}

async function updateFrontendConfig(appPath: string): Promise<void> {
  const mainPath = path.join(appPath, 'src', 'main.tsx');

  const content = await fs.readFile(mainPath, 'utf-8');

  const updated = content.replace(/from\s*["']\.\/amplifyconfiguration\.json["']/g, "from '../amplify_outputs.json'");

  await fs.writeFile(mainPath, updated, 'utf-8');
}

async function convertIndexToESM(appPath: string, dirName: string): Promise<void> {
  const indexPath = path.join(appPath, 'amplify', 'function', dirName, 'index.js');

  const content = await fs.readFile(indexPath, 'utf-8');

  // Replace the dynamic require with a static import and direct array
  let updated = content.replace(
    /const moduleNames = process\.env\.MODULES\.split\(','\);\n\/\*\*\n \* The array of imported modules\.\n \*\/\nconst modules = moduleNames\.map\(\(name\) => require\(`\.\/\$\{name\}`\)\);/,
    "import * as addToGroup from './add-to-group';\n\nconst modules = [addToGroup];",
  );

  // Convert exports.handler to export async function handler
  updated = updated.replace(/exports\.handler\s*=\s*async\s*\((\w+),\s*(\w+)\)\s*=>\s*\{/g, 'export async function handler($1, $2) {');

  await fs.writeFile(indexPath, updated, 'utf-8');
}

async function convertAddToGroupToESM(appPath: string, dirName: string): Promise<void> {
  const filePath = path.join(appPath, 'amplify', 'function', dirName, 'add-to-group.js');

  const content = await fs.readFile(filePath, 'utf-8');

  // Convert require to import
  let updated = content.replace(
    /const \{\n\s*CognitoIdentityProviderClient,\n\s*AdminAddUserToGroupCommand,\n\s*GetGroupCommand,\n\s*CreateGroupCommand,\n\} = require\('@aws-sdk\/client-cognito-identity-provider'\);/,
    "import {\n  CognitoIdentityProviderClient,\n  AdminAddUserToGroupCommand,\n  GetGroupCommand,\n  CreateGroupCommand,\n} from '@aws-sdk/client-cognito-identity-provider';",
  );

  // Convert exports.handler to export const handler
  updated = updated.replace(/exports\.handler\s*=\s*async\s*\((\w+)\)\s*=>\s*\{/g, 'export const handler = async ($1) => {');

  await fs.writeFile(filePath, updated, 'utf-8');
}

async function updatePostConfirmationResource(appPath: string, dirName: string): Promise<void> {
  const resourcePath = path.join(appPath, 'amplify', 'function', dirName, 'resource.ts');
  let content = await fs.readFile(resourcePath, 'utf-8');

  // Update memoryMB from 128 to 512
  content = content.replace(/memoryMB:\s*128/, 'memoryMB: 512');

  // Add resourceGroupName if not present
  if (!content.includes('resourceGroupName')) {
    content = content.replace(/(runtime:\s*\d+),?/, "$1,\n  resourceGroupName: 'auth',");
  }

  await fs.writeFile(resourcePath, content, 'utf-8');
}

export async function postGenerate(appPath: string): Promise<void> {
  const dirName = findPostConfirmationDir(appPath);
  await updateFrontendConfig(appPath);
  await convertIndexToESM(appPath, dirName);
  await convertAddToGroupToESM(appPath, dirName);
  await updatePostConfirmationResource(appPath, dirName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postGenerate(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
