import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const lowstockproducts = defineFunction({
  entry: './index.js',
  name: `lowstockproducts-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    ENV: `${branchName}`,
    REGION: 'us-east-1',
    LOW_STOCK_THRESHOLD: '5',
    PRODUCT_CATALOG_SECRET:
      '/amplify/productcatalog/main/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET',
  },
  runtime: 22,
});
