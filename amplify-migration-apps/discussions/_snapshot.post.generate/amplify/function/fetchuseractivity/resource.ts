import { defineFunction } from '@aws-amplify/backend';
import { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const fetchuseractivity = defineFunction({
  entry: './index.js',
  name: `fetchuseractivity-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.fetchuseractivity.resources.cfnResources.cfnFunction.functionName = `fetchuseractivity-${branchName}`;
}
