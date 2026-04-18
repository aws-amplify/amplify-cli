import { defineFunction } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const lowstockproducts = defineFunction({
  entry: './index.js',
  name: `lowstockproducts-${branchName}`,
  timeoutSeconds: 25,
  memoryMB: 128,
  environment: {
    LOW_STOCK_THRESHOLD: '5',
    PRODUCT_CATALOG_SECRET:
      '/amplify/productcatalog/x/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET',
    ENV: `${branchName}`,
    REGION: 'us-east-1',
  },
  runtime: 22,
});
