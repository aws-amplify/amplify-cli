import { exec, execSync } from 'child_process';
import yargs from 'yargs';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const getArgs = (latestRevision: string) => {
  return yargs(process.argv.slice(2))
    .usage('Usage: $0 -s [rev1] -h [rev2] -b [branch]')
    .nargs('s', 1)
    .describe('s', 'Base revision')
    .default('s', 'dev')
    .nargs('h', 1)
    .describe('h', 'Head revision')
    .default('h', latestRevision)
    .nargs('b', 1)
    .default('b', '')
    .describe('b', 'Branch name').argv;
};

const getHashForRevision = (revision: string) => {
  const buffer = execSync(`git rev-parse ${revision}`);
  return buffer.toString().trim();
};

const getChangedFiles = (rev1: string, rev2: string) => {
  const buffer = execSync(`git diff --name-only ${rev1} ${rev2}`);

  const files = buffer.toString().trim().split('\n');

  return files.filter((f) => !!f.trim());
};

const formatFiles = async (files: string[]): Promise<void> => {
  const command = `npx prettier --write ${files.join(' ')}`;
  const child = exec(command);
  return new Promise((resolve, reject) => {
    child.on('exit', resolve);
  });
};

const confirmBranchName = async (rl: readline.Interface, defaultBranchName: string): Promise<string> => {
  return new Promise<string>((resolve) => {
    rl.question(`Enter a name for the new branch. Default is ${defaultBranchName}\n`, (answer) => {
      if (answer.trim() === '') {
        resolve(defaultBranchName);
      } else {
        resolve(answer);
      }
    });
  });
};

const confirmBranchCreation = async (rl: readline.Interface, branchName: string): Promise<boolean> => {
  return new Promise<boolean>((resolve) => {
    rl.question(`This will create a new branch called ${branchName}. Continue? (y/n) `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
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
  execSync(`git switch ${branch}`);
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
    const { s: base, h: head, b: branch } = args;
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
    const defaultBranchName = `formatting-changes-${base}-${head}`;
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    const confirmedBranchName = branch.trim() || (await confirmBranchName(rl, defaultBranchName));
    if (await confirmBranchCreation(rl, confirmedBranchName)) {
      const baseRevision = getHashForRevision(base);
      createBranch(baseRevision, confirmedBranchName);
      checkoutBranch(confirmedBranchName);
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
