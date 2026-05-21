import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const fitnesstracker33f5545533f55455PreSignup = defineFunction({
  entry: './index.js',
  name: `fitnesstracker33f5545533f55455PreSignup-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    MODULES: 'email-filter-allowlist',
    DOMAINALLOWLIST: 'amazon.com',
    DOMAINBLACKLIST: '',
  },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.fitnesstracker33f5545533f55455PreSignup.resources.cfnResources.cfnFunction.functionName = `fitnesstracker33f5545533f55455PreSignup-${branchName}`;
  backend.fitnesstracker33f5545533f55455PreSignup.addEnvironment(
    'REGION',
    backend.fitnesstracker33f5545533f55455PreSignup.stack.region
  );
}
