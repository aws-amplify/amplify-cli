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

interface PostRefactorOptions {
  appPath: string;
  envName?: string;
}

async function addTableNameToActivityTable(appPath: string, envName: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  console.log(`Adding tableName to activity table in ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  // The generated code creates a Table without tableName:
  // const activity = new Table(storageStack, "activity", { partitionKey: ...
  // We need to add tableName: "activity-<envName>" to preserve the original table name
  const tableName = `activity-${envName}`;

  // Pattern: new Table(storageStack, "activity", { partitionKey:
  // Insert tableName right after the opening brace
  const updated = content.replace(
    /new Table\(storageStack,\s*["']activity["'],\s*\{\s*partitionKey:/g,
    `new Table(storageStack, "activity", { tableName: "${tableName}", partitionKey:`,
  );

  if (updated === content) {
    console.log('  No activity table definition found to update, skipping');
    return;
  }

  await fs.writeFile(backendPath, updated, 'utf-8');
  console.log(`  Added tableName: "${tableName}" to activity table`);
}

export async function postRefactor(options: PostRefactorOptions): Promise<void> {
  const { appPath, envName = 'main' } = options;

  console.log(`Running post-refactor for discussions at ${appPath}`);
  console.log(`Using envName: ${envName}`);
  console.log('');

  await addTableNameToActivityTable(appPath, envName);

  console.log('');
  console.log('Post-refactor completed');
}

// CLI entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const appPath = process.argv[2] || process.cwd();
  const envName = process.argv[3] || 'main';

  postRefactor({ appPath, envName }).catch((error) => {
    console.error('Post-refactor failed:', error);
    process.exit(1);
  });
}
