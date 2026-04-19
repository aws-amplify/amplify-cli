import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const removeuserfromgroup = defineFunction({
  entry: './index.js',
  name: `removeuserfromgroup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.removeuserfromgroup.resources.cfnResources.cfnFunction.functionName = `removeuserfromgroup-${branchName}`;
  backend.removeuserfromgroup.addEnvironment(
    'AUTH_MEDIAVAULT1F08412D_USERPOOLID',
    backend.auth.resources.userPool.userPoolId
  );
}
