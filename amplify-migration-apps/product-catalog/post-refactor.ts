#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for product-catalog app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment s3Bucket.bucketName in amplify/backend.ts to preserve the original bucket name.
 */

import fs from 'fs/promises';
import path from 'path';

interface PostRefactorOptions {
  appPath: string;
  envName?: string;
}

async function uncommentBucketName(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');

  console.log(`Uncommenting s3Bucket.bucketName in ${backendPath}...`);

  let content: string;
  try {
    content = await fs.readFile(backendPath, 'utf-8');
  } catch {
    console.log('  backend.ts not found, skipping');
    return;
  }

  // The generated code has:
  //   // s3Bucket.bucketName = '...';
  // Uncomment it:
  //   s3Bucket.bucketName = '...';
  const updated = content.replace(
    /\/\/\s*(s3Bucket\.bucketName\s*=\s*['"][^'"]+['"];)/,
    '$1',
  );

  if (updated === content) {
    console.log('  No commented bucketName found, skipping');
    return;
  }

  await fs.writeFile(backendPath, updated, 'utf-8');
  console.log('  Uncommented s3Bucket.bucketName');
}

export async function postRefactor(options: PostRefactorOptions): Promise<void> {
  const { appPath } = options;

  console.log(`Running post-refactor for product-catalog at ${appPath}`);
  console.log('');

  await uncommentBucketName(appPath);

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
