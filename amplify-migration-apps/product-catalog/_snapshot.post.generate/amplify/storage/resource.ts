import { defineStorage } from '@aws-amplify/backend';
import { S3Trigger1ef46783 } from './S3Trigger1ef46783/resource';

const 40f1c9f949.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `productcatalogf95af07481f845caa6594c26ac9c8ed331323-${40f1c9f949.deploymentTypeName}`,
  access: (allow) => ({
    'public/*': [allow.authenticated.to(['write', 'read', 'delete'])],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
  }),
  triggers: {
    onUpload: S3Trigger1ef46783,
    onDelete: S3Trigger1ef46783,
  },
});
