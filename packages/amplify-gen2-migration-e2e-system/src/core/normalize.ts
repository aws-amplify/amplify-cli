/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-explicit-any */

import * as path from 'path';
import * as fs from 'fs-extra';

function getFilesRecursive(dir: string): string[] {
  const files: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (fullPath.includes('node_modules')) continue;
    if (entry.isDirectory()) {
      files.push(...getFilesRecursive(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Normalizes snapshot filenames and content so that re-running the e2e
 * system (with no code changes) produces identical snapshots.
 *
 * Run-specific values in CFN stack names (and thus filenames):
 *   1. deploymentName  (timestamp-based, e.g. projectboa2604111848)
 *   2. envName         (10 random lowercase letters)
 *   3. gen1 env hash   (short hash from Amplify)
 *   4. sandbox hash    (CDK sandbox deployment hash)
 *   5. git commit hash (Amplify hosting branch hash)
 *   6. CFN nested stack hashes (CloudFormation physical resource IDs)
 */
export function normalize(appName: string, appDir: string): void {
  const appNameNoDashes = appName.replaceAll('-', '');
  const metaPath = path.join(appDir, '_snapshot.pre.generate', 'amplify', 'backend', 'amplify-meta.json');
  const amplifyMeta: any = JSON.parse(fs.readFileSync(metaPath, 'utf-8'));

  // amplify-projectboards-kjelsxpuch-266a6
  const stackName: string = amplifyMeta.providers.awscloudformation.StackName;
  const deploymentName = stackName.split('-')[1];
  const envName = stackName.split('-')[2];
  const envHash = stackName.split('-')[3];

  rewriteContent(appDir, deploymentName, appNameNoDashes);
  rewriteContent(appDir, envName, 'x');
  rewriteContent(appDir, envHash, 'x');

  renameFile(appDir, deploymentName, appNameNoDashes);
  renameFile(appDir, envName, 'x');
  renameFile(appDir, envHash, 'x');

  const preRefactorSnapshot = path.join(appDir, '_snapshot.pre.refactor');
  const sandboxSegment = '-sandbox-';
  for (const file of fs.readdirSync(preRefactorSnapshot).filter((f) => f.includes(sandboxSegment))) {
    // amplify-projectboards-e2e-sandbox-6e1e2f0442-auth179371D7-1DXO5FVZSYJDX
    const hash = file.split('.')[0].split('-')[4];
    renameFile(appDir, `${sandboxSegment}${hash}-`, `${sandboxSegment}x-`);
  }
  for (const file of fs.readdirSync(preRefactorSnapshot)) {
    // amplify-projectboards-e2e-sandbox-6e1e2f0442-auth179371D7-1DXO5FVZSYJDX
    const hash = file.split('.')[0].split('-').reverse()[0];
    if ([...hash].every((c) => c === 'x')) continue;
    renameFile(appDir, `-${hash}`, '-x');
  }
  for (const file of fs.readdirSync(preRefactorSnapshot)) {
    // amplify-projectboards-kjelsxpuch-266a6-apiprojectboards-OLA0QLF-ConnectionStack-K6BIKS09ZUE6
    const parts = file.split('.')[0].split('-');
    if (parts.length !== 8) {
      continue;
    }
    const hash = parts[5];
    if ([...hash].every((c) => c === 'x')) continue;
    renameFile(appDir, `-${hash}-`, '-x-');
  }
}

function rewriteContent(appDir: string, before: string, after: string): void {
  const snapshots = fs.readdirSync(appDir).filter((f) => f.startsWith('_snapshot'));
  const files = snapshots.flatMap((s) => getFilesRecursive(path.join(appDir, s)));
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8').replaceAll(before, after);
    fs.writeFileSync(file, content, 'utf-8');
  }
}

function renameFile(appDir: string, before: string, after: string): void {
  const snapshots = fs.readdirSync(appDir).filter((f) => f.startsWith('_snapshot'));
  const files = snapshots.flatMap((s) => getFilesRecursive(path.join(appDir, s)));
  for (const file of files) {
    const basename = path.basename(file).replaceAll(before, after);
    fs.renameSync(file, path.join(path.dirname(file), basename));
  }
}
