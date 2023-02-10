import { exec, execSync, spawn } from 'child_process';
import yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const getArgs = (latestRevision: string) => {
  return yargs(process.argv.slice(2))
    .usage('Usage: $0 -1 [rev1] -2 [rev2] -b [branch]')
    .option('base', {
      alias: 's',
      type: 'string',
      default: 'dev',
      describe: 'The base revision to compare (normally dev)',
    })
    .option('head', {
      alias: 'h',
      type: 'string',
      default: latestRevision,
      describe: 'The second revision to compare. Defaults to the latest commit.',
    })
    .option('b', {
      alias: 'branch',
      type: 'string',
      requiresArg: true,
      describe: 'The new branch to create',
    }).argv;
};

const getHashForRevision = (revision: string) => {
  const buffer = execSync(`git rev-parse ${revision}`);
  return buffer.toString().trim();
};

const getChangedFiles = (rev1: string, rev2: string) => {
  const buffer = execSync(`git diff --name-only ${rev1} ${rev2}`);

  const files = buffer
    .toString()
    .trim()
    .split('\n');

  return files.filter(f => !!f.trim());
};

const formatFiles = async (files: string[]): Promise<void> => {
  const command = `npx prettier --write ${files.join(' ')}`;
  const child = exec(command);
  return new Promise((resolve, reject) => {
    child.on('exit', resolve);
  });
};

const confirmBranchCreation = async (defaultBranchName: string): Promise<boolean> => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const branchName = await new Promise<string>(resolve => {
    rl.question(`Enter a name for the new branch. Default is ${defaultBranchName}\n`, answer => {
      if (answer.trim() === '') {
        resolve(defaultBranchName);
      } else {
        resolve(answer);
      }
    });
  });
  return new Promise<boolean>(resolve => {
    rl.question(`This will create a new branch called ${branchName}. Continue? (y/n) `, answer => {
      resolve(answer.trim().toLowerCase() === 'y');
    });
  });
};

const createBranch = (baseBranch: string, newBranchName: string) => {
  try {
    execSync(`git branch ${newBranchName} ${baseBranch}`);
  } catch (e) {
    if (e.status === 128) {
      throw new Error('Branch already exists. Please delete it first.');
    }
  }
};

const checkoutBranch = (branch: string) => {
  execSync(`git checkout ${branch}`);
};

const assertCleanWorkingTree = () => {
  const buffer = execSync('git status --porcelain');
  if (buffer.toString().trim()) {
    throw new Error('Working tree is not clean. Please commit or stash changes.');
  }
};

const isCompatibleWithPrettier = (filePath: string): boolean => {
  return /.*?((j|t)sx?$|vue|graphql|html?|md|s?css|sass|json|yaml)/.test(filePath);
};

const doesFileExist = (filePath: string): boolean => fs.existsSync(path.join(process.cwd(), filePath));

const main = async () => {
  try {
    const shortHashLatestRevision = getHashForRevision('HEAD').slice(0, 7);
    const args = getArgs(shortHashLatestRevision);
    const { base, head } = args;
    if (!base || !head) {
      throw new Error('Missing revisions to compare');
    }
    assertCleanWorkingTree();
    const unfilteredFiles = getChangedFiles(base, head);
    const prettierCompatibleFiles = unfilteredFiles.filter(doesFileExist).filter(isCompatibleWithPrettier);
    if (prettierCompatibleFiles.length === 0) {
      console.info('No files changed. Exiting...');
      process.exit(0);
    }
    const defaultBranchName = args.b || `formatting-changes-${base}-${head}`;
    if (await confirmBranchCreation(defaultBranchName)) {
      const baseRevision = getHashForRevision(base);
      createBranch(baseRevision, defaultBranchName);
      checkoutBranch(defaultBranchName);
    } else {
      throw new Error('Aborted');
    }
    await formatFiles(prettierCompatibleFiles);
    console.info('Done. Exiting...');
    process.exit(0);
  } catch (e) {
    if (e.message === 'Aborted') {
      console.info('No new branch created. Exiting...');
      process.exit(0);
    }
    console.error(e.message);
    process.exit(1);
  }
};

main();
