import { defineFunction } from '@aws-amplify/backend';
import type { Backend } from '../../backend';

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
      '/amplify/productcatalog/x/AMPLIFY_lowstockproducts_PRODUCT_CATALOG_SECRET',
  },
  runtime: 22,
});

export function applyEscapeHatches(backend: Backend) {
  backend.lowstockproducts.resources.cfnResources.cfnFunction.functionName = `lowstockproducts-${branchName}`;
  backend.lowstockproducts.addEnvironment(
    'API_PRODUCTCATALOG_GRAPHQLAPIKEYOUTPUT',
    backend.data.apiKey!
  );
  backend.lowstockproducts.addEnvironment(
    'API_PRODUCTCATALOG_GRAPHQLAPIENDPOINTOUTPUT',
    backend.data.graphqlUrl
  );
  backend.lowstockproducts.addEnvironment(
    'API_PRODUCTCATALOG_GRAPHQLAPIIDOUTPUT',
    backend.data.apiId
  );
  backend.data.resources.graphqlApi.grantQuery(
    backend.lowstockproducts.resources.lambda
  );
}
