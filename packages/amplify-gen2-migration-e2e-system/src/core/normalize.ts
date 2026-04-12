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

  // StackName: amplify-{appNameNoDashes}-{envName}-{envHash}
  const stackName: string = amplifyMeta.providers.awscloudformation.StackName;
  const stackParts = stackName.split('-');
  const gen1EnvName = stackParts[2];
  const gen1EnvHash = stackParts[3];

  const mappings: Record<string, string> = {};
  mappings[gen1EnvName] = 'envname';
  mappings[gen1EnvHash] = 'envhash';

  // --- Scan pre.refactor filenames for run-specific values ---------------
  const preRefactorDir = path.join(appDir, '_snapshot.pre.refactor');
  if (!fs.existsSync(preRefactorDir)) return;
  const preRefactorFiles = fs.readdirSync(preRefactorDir);

  // Pass 1: deploymentName, sandbox hash, commit hash
  for (const file of preRefactorFiles) {
    const base = file.split('.')[0];

    // amplify-{deploymentName}-e2e-sandbox-{sandboxHash}...
    const sbx = base.match(new RegExp(`^amplify-(${appNameNoDashes.slice(0, 10)}\\d{10})-e2e-sandbox-([0-9a-f]+)`));
    if (sbx) {
      mappings[sbx[1]] = appNameNoDashes;
      mappings[sbx[2]] = 'sandboxhash';
    }

    // amplify-{deploymentName}-{envName}-{envHash}...
    const g1d = base.match(new RegExp(`^amplify-(${appNameNoDashes.slice(0, 10)}\\d{10})-${gen1EnvName}-${gen1EnvHash}`));
    if (g1d) mappings[g1d[1]] = appNameNoDashes;

    // amplify-{app|deploymentName}-gen2{envName}-branch-{commitHash}...
    const br = base.match(
      new RegExp(`^amplify-(?:${appNameNoDashes}|${appNameNoDashes.slice(0, 10)}\\d{10})-gen2${gen1EnvName}-branch-([0-9a-f]+)`),
    );
    if (br) mappings[br[1]] = 'commithash';
  }

  // Pass 2: CFN nested stack hashes.
  // Strip the known root-stack prefix from each filename, then collect
  // every dash-separated segment that looks like a CFN hash.
  const deploymentNames = Object.entries(mappings)
    .filter(([, v]) => v === appNameNoDashes)
    .map(([k]) => k);
  const appPrefixes = [appNameNoDashes, ...deploymentNames];

  const sandboxHashes = Object.entries(mappings)
    .filter(([, v]) => v === 'sandboxhash')
    .map(([k]) => k);
  const commitHashes = Object.entries(mappings)
    .filter(([, v]) => v === 'commithash')
    .map(([k]) => k);

  for (const file of preRefactorFiles) {
    const base = file.split('.')[0];
    if (!base.startsWith('amplify-')) continue;

    let rest = base.slice('amplify-'.length);

    // Strip app/deployment prefix
    let found = false;
    for (const p of appPrefixes) {
      if (rest.startsWith(p + '-')) {
        rest = rest.slice(p.length + 1);
        found = true;
        break;
      }
    }
    if (!found) continue;

    // Strip env/sandbox/branch prefix to isolate nested-stack portion
    if (rest.startsWith('e2e-sandbox-')) {
      rest = rest.slice('e2e-sandbox-'.length);
      for (const h of sandboxHashes) {
        if (rest.startsWith(h + '-')) {
          rest = rest.slice(h.length + 1);
          break;
        }
        if (rest === h) {
          rest = '';
          break;
        }
      }
    } else if (rest.startsWith(`gen2${gen1EnvName}-branch-`)) {
      rest = rest.slice(`gen2${gen1EnvName}-branch-`.length);
      for (const h of commitHashes) {
        if (rest.startsWith(h + '-')) {
          rest = rest.slice(h.length + 1);
          break;
        }
        if (rest === h) {
          rest = '';
          break;
        }
      }
    } else if (rest.startsWith(`${gen1EnvName}-${gen1EnvHash}`)) {
      rest = rest.slice(`${gen1EnvName}-${gen1EnvHash}`.length);
      if (rest.startsWith('-')) rest = rest.slice(1);
    } else {
      continue;
    }

    if (!rest) continue;

    // `rest` is now the nested-stack suffix, e.g.:
    //   auth179371D7-17X846ZMEAIKY
    //   apiprojectboards-13VBWUTDNJGOL-Project-UTM3G4MLN93I
    //   amplifyDataTodoNestedStackTodoNestedStackR-1T2LN2EMRF641
    for (const seg of rest.split('-')) {
      if (!seg) continue;
      // Pure lowercase = category name (auth, storage, api, etc.)
      if (/^[a-z]+$/.test(seg)) continue;
      // category + lowercase hex = deterministic resource ID (storages369f8ff1c)
      if (/^[a-z]+[0-9a-f]+$/.test(seg)) continue;
      // category + 8-char hex construct ID (auth179371D7, storage0EC3F24A)
      if (/^[a-z]+[0-9A-F]{8}$/.test(seg)) continue;
      // Pure 8-char hex = deterministic CDK construct ID (179371D7)
      if (/^[0-9A-F]{8}$/.test(seg)) continue;
      // camelCase structural name with no digits (amplifyDataTodoNestedStack...)
      if (/^[a-z][a-zA-Z]+$/.test(seg)) continue;
      // Known structural keywords
      if (['ConnectionStack', 'CustomResourcesjson', 'FunctionDirectiveStack', 'Project', 'Todo'].includes(seg)) continue;
      // Everything else is a CFN hash
      mappings[seg] = 'HASH';
    }
  }

  // --- Apply mappings to all snapshot files (basename only for renames) ---
  const snapshots = fs.readdirSync(appDir).filter((f) => f.startsWith('_snapshot'));
  const files = snapshots.flatMap((s) => getFilesRecursive(path.join(appDir, s)));
  const sorted = Object.entries(mappings).sort(([a], [b]) => b.length - a.length);

  for (const file of files) {
    let content = fs.readFileSync(file, 'utf-8');
    for (const [value, replacement] of sorted) {
      content = content.replaceAll(value, replacement);
    }
    fs.writeFileSync(file, content, 'utf-8');

    const dir = path.dirname(file);
    let base = path.basename(file);
    for (const [value, replacement] of sorted) {
      base = base.replaceAll(value, replacement);
    }
    const newPath = path.join(dir, base);
    if (newPath !== file) {
      fs.renameSync(file, newPath);
    }
  }
}
