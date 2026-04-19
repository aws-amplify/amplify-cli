import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const recorduseractivity = defineFunction({
  entry: './index.js',
  name: `recorduseractivity-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.recorduseractivity.resources.cfnResources.cfnFunction.functionName = `recorduseractivity-${branchName}`;
}
