#!/usr/bin/env npx tsx

import * as path from 'path';
import { normalize } from '../packages/amplify-e2e-gen2-migration/src/core/normalize';

async function main() {
  const appName = path.basename(process.cwd());
  const appDir = path.join(__dirname, appName);
  normalize(appName, appDir);
}

main();
