#!/usr/bin/env npx tsx

import * as path from 'path';
import { sanitize } from '../packages/amplify-e2e-gen2-migration/src/core/sanitize';

/**
 * Sanitizes sensitive values in Amplify migration app snapshot files for safe public commit.
 *
 * Usage: cd into an app directory under amplify-migration-apps/, then run:
 *   npx tsx ../sanitize.ts
 */
async function main() {
  const appName = path.basename(process.cwd());
  const appDir = path.join(__dirname, appName);
  sanitize(appName, appDir);
}

main();
