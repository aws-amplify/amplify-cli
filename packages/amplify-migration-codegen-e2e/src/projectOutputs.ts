import path from 'node:path';
import { $TSAny } from '@aws-amplify/amplify-cli-core';
import { readJsonFile } from '@aws-amplify/amplify-e2e-core';

const getProjectOutputsPath = (projectRoot: string) => path.join(projectRoot, 'amplify_outputs.json');

export const getProjectOutputs = (projectRoot: string): $TSAny => {
  const metaFilePath: string = getProjectOutputsPath(projectRoot);
  return readJsonFile(metaFilePath);
};
