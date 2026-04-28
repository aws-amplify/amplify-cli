import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const thumbnailgen = defineFunction({
  entry: './index.js',
  name: `thumbnailgen-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.thumbnailgen.resources.cfnResources.cfnFunction.functionName = `thumbnailgen-${branchName}`;
  backend.thumbnailgen.addEnvironment(
    'STORAGE_MEDIAVAULT_BUCKETNAME',
    backend.storage.resources.bucket.bucketName
  );
}
