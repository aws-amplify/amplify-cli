#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for discussions app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Add tableName to DynamoDB table definitions in backend.ts
 * 2. Uncomment the S3 bucket name in backend.ts
 */

import fs from 'fs/promises';
import path from 'path';

async function uncommentTableNames(appPath: string, envName: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  // Add tableName to activity table
  content = content.replace(
    /new Table\(storage\w+Stack,\s*['"]activity['"],\s*\{\s*partitionKey:/g,
    `new Table(storageActivityStack, 'activity', { tableName: 'activity-${envName}', partitionKey:`,
  );

  // Add tableName to bookmarks table
  content = content.replace(
    /new Table\(storage\w+Stack,\s*['"]bookmarks['"],\s*\{\s*partitionKey:/g,
    `new Table(storageBookmarksStack, 'bookmarks', { tableName: 'bookmarks-${envName}', partitionKey:`,
  );

  // Uncomment S3 bucket name
  content = content.replace(
    /\/\/ (s3Bucket\.bucketName = '[^']+';)/,
    '$1',
  );

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postRefactor(appPath: string, envName = 'main'): Promise<void> {
  await uncommentTableNames(appPath, envName);
}

async function main(): Promise<void> {
  const [appPath = process.cwd(), envName] = process.argv.slice(2);
  await postRefactor(appPath, envName);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
