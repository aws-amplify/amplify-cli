import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const moodboardGetRandomEmoji = defineFunction({
  entry: './index.js',
  name: `moodboardGetRandomEmoji-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: process.env.AWS_REGION ?? '' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.moodboardGetRandomEmoji.resources.cfnResources.cfnFunction.functionName = `moodboardGetRandomEmoji-${branchName}`;
}
