import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const S3Trigger1ef46783 = defineFunction({
  entry: './index.js',
  name: `S3Trigger1ef46783-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${branchName}` },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.S3Trigger1ef46783.resources.cfnResources.cfnFunction.functionName = `S3Trigger1ef46783-${branchName}`;
  backend.S3Trigger1ef46783.addEnvironment(
    'API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT',
    backend.data.apiKey!
  );
  backend.S3Trigger1ef46783.addEnvironment(
    'API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT',
    backend.data.graphqlUrl
  );
  backend.S3Trigger1ef46783.addEnvironment(
    'API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT',
    backend.data.apiId
  );
  backend.S3Trigger1ef46783.addEnvironment(
    'REGION',
    backend.S3Trigger1ef46783.stack.region
  );
  backend.data.resources.graphqlApi.grantMutation(
    backend.S3Trigger1ef46783.resources.lambda
  );
}
