#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for backend-only app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment s3Bucket.bucketName in amplify/backend.ts to sync with deployed template
 */

import fs from 'fs/promises';
import path from 'path';

async function uncommentS3BucketName(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  const content = await fs.readFile(backendPath, 'utf-8');

  const updated = content.replace(
    /\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];?)/g,
    '$1',
  );

  await fs.writeFile(backendPath, updated, 'utf-8');
}

export async function postRefactor(appPath: string): Promise<void> {
  await uncommentS3BucketName(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postRefactor(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
