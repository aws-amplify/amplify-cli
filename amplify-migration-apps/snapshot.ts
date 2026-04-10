#!/usr/bin/env npx tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import * as e2esnap from '../packages/amplify-gen2-migration-e2e-system/src/core/snapshot';

const STEPS = ['pre.generate', 'post.generate', 'pre.refactor', 'post.refactor'] as const;
type Step = (typeof STEPS)[number];

function usage(): never {
  console.error(`Usage: npx tsx snapshot.ts <step> <app-name> [deployed-app-path] [amplify-app-name] [gen2-branch] [gen1-env]

Steps: ${STEPS.join(', ')}

  app-name:          Directory name under amplify-migration-apps/
  deployed-app-path: Path to the deployed app (required for pre/post.generate and post.refactor)
  amplify-app-name:  Actual Amplify app name if different from app-name (default: app-name without dashes)
  gen2-branch:       Gen2 branch name (default: gen2-main)
  gen1-env:          Gen1 environment name (default: main)`);

  process.exit(1);
}

async function main(): Promise<void> {
  const [snapshot, appDir, deployPath, gen2StackName] = process.argv.slice(2);

  if (!snapshot || !STEPS.includes(snapshot as Step) || !appDir) {
    usage();
  }

  const sourceAppPath = path.resolve(path.join(__dirname, appDir));
  const deployedAppPath = deployPath ?? sourceAppPath;

  switch (snapshot as Step) {
    case 'pre.generate':
      if (!deployedAppPath) usage();
      await e2esnap.capturePreGenerate(deployedAppPath, sourceAppPath)
      break;
    case 'post.generate':
      if (!deployedAppPath) usage();
      await e2esnap.capturePostGenerate(deployedAppPath, sourceAppPath);
      break;
    case 'pre.refactor':
      if (!gen2StackName) usage();
      const tpiPath = path.join(deployedAppPath, 'amplify', 'team-provider-info.json');
      const tpi = JSON.parse(fs.readFileSync(tpiPath, { encoding: 'utf-8'}));
      const gen1StackName = (Object.values(tpi)[0] as any).awscloudformation.StackName;
      await e2esnap.capturePreRefactor(gen1StackName, gen2StackName, sourceAppPath);
      break;
    case 'post.refactor':
      if (!deployedAppPath) usage();
      await e2esnap.capturePostRefactor(deployedAppPath, sourceAppPath);
      break;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
