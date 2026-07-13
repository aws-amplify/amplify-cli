#!/usr/bin/env npx ts-node
/**
 * Post-refactor script for fitness-tracker app.
 *
 * Applies manual edits required after `amplify gen2-migration refactor`:
 * 1. Uncomment the postRefactor() call in amplify/backend.ts
 */

import fs from 'fs/promises';
import path from 'path';

async function uncommentPostRefactorCall(appPath: string): Promise<void> {
  const backendPath = path.join(appPath, 'amplify', 'backend.ts');
  let content = await fs.readFile(backendPath, 'utf-8');

  content = content.replace(/\/\/\s*(postRefactor\(\);?)/, '$1');

  await fs.writeFile(backendPath, content, 'utf-8');
}

export async function postRefactor(appPath: string): Promise<void> {
  await uncommentPostRefactorCall(appPath);
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  await postRefactor(appPath);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
