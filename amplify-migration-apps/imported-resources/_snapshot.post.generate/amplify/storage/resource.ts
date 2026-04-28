import { defineStorage } from '@aws-amplify/backend';
import { CfnResource } from 'aws-cdk-lib';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `importedresources8c81d8d7ede741f3b102b3e1686abe8a9e9-${branchName}`,
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
  }),
});

export function postRefactor(backend: Backend) {
  const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
  s3Bucket.bucketName =
    'importedresources8c81d8d7ede741f3b102b3e1686abe8a9e9-main';
}

export function applyEscapeHatches(backend: Backend) {
  const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
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
  for (const cfnResource of backend.storage.stack.node
    .findAll()
    .filter(
      (c) =>
        CfnResource.isCfnResource(c) &&
        ['AWS::S3::Bucket', 'Custom::S3AutoDeleteObjects'].includes(
          c.cfnResourceType
        )
    )) {
    (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
    (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
  }
}
