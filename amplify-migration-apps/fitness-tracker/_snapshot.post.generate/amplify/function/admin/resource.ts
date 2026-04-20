import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const admin = defineFunction({
  entry: './index.js',
  name: `admin-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.admin.resources.cfnResources.cfnFunction.functionName = `admin-${branchName}`;
  backend.admin.addEnvironment(
    'AUTH_FITNESSTRACKER33F5545533F55455_USERPOOLID',
    backend.auth.resources.userPool.userPoolId
  );
}
