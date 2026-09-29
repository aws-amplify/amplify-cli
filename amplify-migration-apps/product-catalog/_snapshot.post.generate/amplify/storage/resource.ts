import { defineStorage } from '@aws-amplify/backend';
import { S3Trigger1ef46783 } from '../function/S3Trigger1ef46783/resource';
import { CfnResource } from 'aws-cdk-lib';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `productcatalogf95af07481f845caa6594c26ac9c8ed3x-${branchName}`,
  access: (allow) => ({
    'public/*': [allow.authenticated.to(['write', 'read', 'delete'])],
    'protected/{entity_id}/*': [
      allow.entity('identity').to(['write', 'read', 'delete']),
      allow.authenticated.to(['read']),
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['write', 'read', 'delete']),
    ],
  }),
  triggers: {
    onUpload: S3Trigger1ef46783,
    onDelete: S3Trigger1ef46783,
  },
});

export function postRefactor(backend: Backend) {
  const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
  s3Bucket.bucketName = 'productcatalogf95af07481f845caa6594c26ac9c8ed3x-x';
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
