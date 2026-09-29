import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const quotegenerator = defineFunction({
  entry: './index.js',
  name: `quotegenerator-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.quotegenerator.resources.cfnResources.cfnFunction.functionName = `quotegenerator-${branchName}`;
}
