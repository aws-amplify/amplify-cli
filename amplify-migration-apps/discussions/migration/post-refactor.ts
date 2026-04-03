#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for discussions app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Add tableName to the DynamoDB table definition in backend.ts
 *    This ensures the refactored table keeps its original name.
 */

import fs from 'fs/promises';
import path from 'path';

async function addTableNameToActivityTable(appPath: string, envName: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  const content = await fs.readFile(backendPath, 'utf-8');

  const tableName = `activity-${envName}`;

  const updated = content.replace(
    /new Table\(storageStack,\s*["']activity["'],\s*\{\s*partitionKey:/g,
    `new Table(storageStack, "activity", { tableName: "${tableName}", partitionKey:`,
  );

  await fs.writeFile(backendPath, updated, 'utf-8');
}

export async function postRefactor(appPath: string, envName = 'main'): Promise<void> {
  await addTableNameToActivityTable(appPath, envName);
}

async function main(): Promise<void> {
  const [appPath, envName] = process.argv.slice(2);
  await postRefactor(appPath, envName);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
