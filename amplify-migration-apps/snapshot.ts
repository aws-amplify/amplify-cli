#!/usr/bin/env npx tsx

import * as fs from 'fs-extra';
import * as path from 'path';
import * as e2esnap from '../packages/amplify-e2e-gen2-migration/src/core/snapshot';
import * as e2esani from '../packages/amplify-e2e-gen2-migration/src/core/sanitize';
import * as e2enorm from '../packages/amplify-e2e-gen2-migration/src/core/normalize'

const STEPS = ['pre.generate', 'post.generate', 'pre.refactor', 'post.refactor'] as const;
type Step = (typeof STEPS)[number];

function usage(): never {
  console.error(`Usage: npx tsx snapshot.ts <step> <app-dir> [deployed-app-path] [gen2-stack-name]

Steps: ${STEPS.join(', ')}

  app-dir:           Directory name under amplify-migration-apps/
  deployed-app-path: Path to the deployed app (required for pre/post.generate and post.refactor; defaults to app-dir)
  gen2-stack-name:   Gen2 root stack name (required for pre.refactor)`);

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
      await e2esnap.capturePreGenerate(deployedAppPath, sourceAppPath);
      break;
    case 'post.generate':
      if (!deployedAppPath) usage();
      await e2esnap.capturePostGenerate(deployedAppPath, sourceAppPath);
      break;
    case 'pre.refactor':
      if (!gen2StackName) usage();
      const tpiPath = path.join(deployedAppPath, 'amplify', 'team-provider-info.json');
      const tpi = JSON.parse(fs.readFileSync(tpiPath, { encoding: 'utf-8' }));
      const gen1StackName = (Object.values(tpi)[0] as any).awscloudformation.StackName;
      await e2esnap.capturePreRefactor(gen1StackName, gen2StackName, sourceAppPath);
      break;
    case 'post.refactor':
      if (!deployedAppPath) usage();
      await e2esnap.capturePostRefactor(deployedAppPath, sourceAppPath);
      break;
  }

  e2enorm.normalize(appDir, sourceAppPath);
  e2esani.sanitize(appDir, sourceAppPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
