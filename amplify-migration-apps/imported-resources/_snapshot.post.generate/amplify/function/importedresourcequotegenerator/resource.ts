import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const importedresourcequotegenerator = defineFunction({
  entry: './index.js',
  name: `importedresourcequotegenerator-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}` },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.importedresourcequotegenerator.resources.cfnResources.cfnFunction.functionName = `importedresourcequotegenerator-${branchName}`;
  backend.importedresourcequotegenerator.addEnvironment(
    'REGION',
    backend.importedresourcequotegenerator.stack.region
  );
}
