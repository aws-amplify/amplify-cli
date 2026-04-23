import { auth } from './auth/resource';
import { data } from './data/resource';
import { storage } from './storage/resource';
import { importedresourcequotegenerator } from './function/importedresourcequotegenerator/resource';
import { defineBackend } from '@aws-amplify/backend';
// import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  data,
  storage,
  importedresourcequotegenerator,
});
const cfnGraphqlApi = backend.data.resources.cfnResources.cfnGraphqlApi;
cfnGraphqlApi.additionalAuthenticationProviders = [
  {
    authenticationType: 'AMAZON_COGNITO_USER_POOLS',
    userPoolConfig: {
      userPoolId: backend.auth.resources.userPool.userPoolId,
      awsRegion: backend.auth.stack.region,
    },
  },
];
const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
// Use this bucket name post refactor
// s3Bucket.bucketName = 'importedresources8c81d8d7ede741f3b102b3e1686abe8a9e9-main';
s3Bucket.bucketEncryption = {
  serverSideEncryptionConfiguration: [
    {
      serverSideEncryptionByDefault: {
        sseAlgorithm: 'AES256',
      },
      bucketKeyEnabled: false,
    },
  ],
};
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.importedresourcequotegenerator.resources.cfnResources.cfnFunction.functionName = `importedresourcequotegenerator-${branchName}`;

// Uncomment post refactor to force a redeployment
// Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
