#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for discussions app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Add tableName to the activity DynamoDB table definition in backend.ts
 * 2. Add tableName to the bookmarks DynamoDB table definition in backend.ts
 * 3. Uncomment s3Bucket.bucketName to preserve the original bucket name
 */

import fs from 'fs/promises';
import path from 'path';

async function addTableNameToTable(
  appPath: string,
  stackVar: string,
  tableId: string,
  envName: string,
): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  const content = await fs.readFile(backendPath, 'utf-8');

  const tableName = `${tableId}-${envName}`;

  // Insert tableName as its own property line after the opening brace,
  // matching the indentation of the existing partitionKey property.
  const updated = content.replace(
    new RegExp(
      `(new Table\\(${stackVar},\\s*["']${tableId}["'],\\s*\\{\\n)(\\s*)(partitionKey:)`,
    ),
    `$1$2tableName: '${tableName}',\n$2$3`,
  );

  await fs.writeFile(backendPath, updated, 'utf-8');
}

async function uncommentS3BucketName(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  const content = await fs.readFile(backendPath, 'utf-8');

  const updated = content.replace(
    /\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];?)/g,
    '$1',
  );

  await fs.writeFile(backendPath, updated, 'utf-8');
}

async function uncommentPostRefactorTag(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  content = content.replace(/\/\/\s*(import \{ Tags \} from 'aws-cdk-lib';)/, '$1');
  content = content.replace(
    /\/\/\s*(Tags\.of\(backend\.stack\)\.add\(['"]gen2-migration\/post-refactor['"],\s*['"]true['"]\);?)/,
    '$1',
  );

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postRefactor(appPath: string, envName: string): Promise<void> {
  await addTableNameToTable(appPath, 'storageActivityStack', 'activity', envName);
  await addTableNameToTable(appPath, 'storageBookmarksStack', 'bookmarks', envName);
  await uncommentS3BucketName(appPath);
  await uncommentPostRefactorTag(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  if (!process.env.ENV_NAME) {
    throw new Error(`Missing ENV_NAME env variable`);
  }
  await postRefactor(appPath, process.env.ENV_NAME);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
