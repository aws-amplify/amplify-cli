import fs from 'fs-extra';
import * as path from 'path';
import { JSONUtilities } from 'amplify-cli-core';
import { Template } from 'cloudform';
import { Diff, diff as getDiffs } from 'deep-diff';

const ROOT_STACK_FILE_NAME = 'cloudformation-template.json';

export interface DiffableProject {
  stacks: {
    [stackName: string]: Template;
  };
  root: Template;
}

export type DiffChanges<T> = Array<Diff<DiffableProject, DiffableProject>>;

interface GQLDiff {
  diff: DiffChanges<DiffableProject>;
  next: DiffableProject;
  current: DiffableProject;
}

export const getGQLDiff = (currentBackendDir: string, cloudBackendDir: string): GQLDiff => {
  const currentBuildDir = path.join(currentBackendDir, 'build');
  const cloudBuildDir = path.join(cloudBackendDir, 'build');
  if (fs.existsSync(cloudBuildDir) && fs.existsSync(currentBuildDir)) {
    const current = loadDiffableProject(cloudBuildDir, ROOT_STACK_FILE_NAME);
    const next = loadDiffableProject(currentBuildDir, ROOT_STACK_FILE_NAME);
    return { current, next, diff: getDiffs(current, next) };
  }
  return null;
};

function loadDiffableProject(path: string, rootStackName: string): DiffableProject {
  const project = readFromPath(path);
  const currentStacks = project.stacks || {};
  const diffableProject: DiffableProject = {
    stacks: {},
    root: {},
  };
  for (const key of Object.keys(currentStacks)) {
    diffableProject.stacks[key] = JSONUtilities.parse(project.stacks[key]);
  }
  if (project[rootStackName]) {
    diffableProject.root = JSONUtilities.parse(project[rootStackName]);
  }
  return diffableProject;
}

export function readFromPath(directory: string): any {
  const pathExists = fs.pathExistsSync(directory);
  if (!pathExists) {
    return undefined;
  }
  const dirStats = fs.lstatSync(directory);
  if (!dirStats.isDirectory()) {
    const buf = fs.readFileSync(directory);
    return buf.toString();
  }
  const files = fs.readdirSync(directory);
  const accum = {};
  for (const fileName of files) {
    const fullPath = path.join(directory, fileName);
    const value = readFromPath(fullPath);
    accum[fileName] = value;
  }
  return accum;
}
