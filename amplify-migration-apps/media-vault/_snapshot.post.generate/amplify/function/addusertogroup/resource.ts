import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const addusertogroup = defineFunction({
  entry: './index.js',
  name: `addusertogroup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}`, REGION: 'us-east-1' },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.addusertogroup.resources.cfnResources.cfnFunction.functionName = `addusertogroup-${branchName}`;
  backend.addusertogroup.addEnvironment(
    'AUTH_MEDIAVAULT1F08412D_USERPOOLID',
    backend.auth.resources.userPool.userPoolId
  );
}
