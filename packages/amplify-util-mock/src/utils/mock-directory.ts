import { $TSContext } from 'amplify-cli-core';
import * as path from 'path';

export function getMockDataDirectory(context: $TSContext) {
  const { projectPath } = context.amplify.getEnvInfo();
  return path.join(projectPath, 'amplify', 'mock-data');
}

export function getMockSearchableTriggerDirectory(context: $TSContext) {
  const mockSearchableResourceDirectory = getMockSearchableResourceDirectory(context);
  return path.join(mockSearchableResourceDirectory, 'searchable-lambda-trigger');
}

export function getMockSearchableResourceDirectory(context: $TSContext) {
  const mockAPIResourceDirectory = getMockAPIResourceDirectory(context);
  return path.join(mockAPIResourceDirectory, 'searchable');
}

export function getMockAPIResourceDirectory(context: $TSContext) {
  const { projectPath } = context.amplify.getEnvInfo();
  return path.join(projectPath, 'amplify', 'mock-api-resources');
}
