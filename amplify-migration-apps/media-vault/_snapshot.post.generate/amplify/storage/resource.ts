import { defineStorage } from '@aws-amplify/backend';
import { CfnResource } from 'aws-cdk-lib';
import type { Backend } from '../backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
/**
 * TODO: Your project uses group permissions. Group permissions have changed in Gen 2. In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern. */

export const storage = defineStorage({
  name: `mediavaultb574f210f1634e3a8d1934f263da5bedx-${branchName}`,
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['write', 'read', 'delete']),
      allow.groups(['Admin']).to(['write', 'read', 'delete']),
      allow.groups(['Basic']).to(['read']),
    ],
    'protected/{entity_id}/*': [
      allow.entity('identity').to(['write', 'read', 'delete']),
      allow.authenticated.to(['read']),
      allow.groups(['Admin']).to(['write', 'read', 'delete']),
      allow.groups(['Basic']).to(['read']),
    ],
    'private/{entity_id}/*': [
      allow.entity('identity').to(['write', 'read', 'delete']),
      allow.groups(['Admin']).to(['write', 'read', 'delete']),
      allow.groups(['Basic']).to(['read']),
    ],
  }),
});

export function postRefactor(backend: Backend) {
  const s3Bucket = backend.storage.resources.cfnResources.cfnBucket;
  s3Bucket.bucketName = 'mediavaultb574f210f1634e3a8d1934f263da5bedx-x';
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
