#!/usr/bin/env npx ts-node
/**
 * Post-rollback script for media-vault app.
 *
 * Reverses the manual edits applied by post-refactor:
 * 1. Comment back the postRefactor() call in amplify/backend.ts
 */

import fs from 'fs/promises';
import path from 'path';

async function commentPostRefactorCall(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  content = content.replace(/^(\s*)(postRefactor\(\);?)$/m, '$1// $2');

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postRollback(appPath: string): Promise<void> {
  await commentPostRefactorCall(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postRollback(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
