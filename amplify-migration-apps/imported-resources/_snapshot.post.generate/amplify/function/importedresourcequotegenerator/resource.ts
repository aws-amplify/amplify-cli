import { defineFunction } from '@aws-amplify/backend';

const c643a9b272.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const importedresourcequotegenerator = defineFunction({
  entry: './index.js',
  name: `importedresourcequotegenerator-${c643a9b272.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: { ENV: `${c643a9b272.deploymentTypeName}`, REGION: 'us-east-1' },
  runtime: 22,
});
