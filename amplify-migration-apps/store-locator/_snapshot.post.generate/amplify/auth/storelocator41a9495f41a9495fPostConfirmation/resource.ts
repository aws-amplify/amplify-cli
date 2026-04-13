import { defineFunction } from '@aws-amplify/backend';

const 38b5101cfb.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const storelocator41a9495f41a9495fPostConfirmation = defineFunction({
  entry: './index.js',
  name: `storelocator41a9495f41a9495fPostConfirmation-${38b5101cfb.deploymentTypeName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${38b5101cfb.deploymentTypeName}`,
    MODULES: 'add-to-group',
    REGION: 'us-east-1',
    GROUP: 'storeLocatorAdmin',
  },
  runtime: 22,
});
