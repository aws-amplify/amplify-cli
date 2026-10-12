import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storelocator41a9495f41a9495fPostConfirmation = defineFunction({
  entry: './index.js',
  name: `storelocator41a9495f41a9495fPostConfirmation-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    MODULES: 'add-to-group',
    REGION: process.env.AWS_REGION ?? '',
    GROUP: 'storeLocatorAdmin',
  },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.storelocator41a9495f41a9495fPostConfirmation.resources.cfnResources.cfnFunction.functionName = `storelocator41a9495f41a9495fPostConfirmation-${branchName}`;
}
