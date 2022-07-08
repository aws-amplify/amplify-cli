import { $TSContext } from 'amplify-cli-core';
import * as path from 'path';

export function getMockDataDirectory(context: $TSContext) {
  const { projectPath } = context.amplify.getEnvInfo();
  return path.join(projectPath, 'amplify', 'mock-data');
}

export function getMockSearchableTriggerDirectory(context: $TSContext) {
  const { projectPath } = context.amplify.getEnvInfo();
  return path.join(projectPath, 'amplify', 'mock-searchable-trigger');
}