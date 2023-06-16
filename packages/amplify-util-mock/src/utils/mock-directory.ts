import { $TSContext } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';

export function getMockDataDirectory(context: $TSContext) {
  const { projectPath } = context.amplify.getEnvInfo();
  return path.join(projectPath, 'amplify', 'mock-data');
}

export function getMockSearchableTriggerDirectory(context: $TSContext) {
  const mockSearchableResourceDirectory = getMockSearchableResourceDirectory(context);
  return path.join(mockSearchableResourceDirectory, 'searchable-lambda-trigger');
}

export function getMockOpensearchDataDirectory(context: $TSContext) {
  const mockSearchableResourceDirectory = getMockSearchableResourceDirectory(context);
  return path.join(mockSearchableResourceDirectory, 'searchable-data');
}

export function getMockSearchableResourceDirectory(context: $TSContext) {
  const mockAPIResourceDirectory = getMockAPIResourceDirectory(context);
  return path.join(mockAPIResourceDirectory, 'searchable');
}

export function getMockAPIResourceDirectory(context: $TSContext) {
  const { projectPath } = context.amplify.getEnvInfo();
  return path.join(projectPath, 'amplify', 'mock-api-resources');
}
