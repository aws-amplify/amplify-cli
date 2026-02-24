import { defineStorage } from '@aws-amplify/backend';
import { thumbnailgen } from '../storage/thumbnailgen/resource';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';
/**
 * TODO: Your project uses group permissions. Group permissions have changed in Gen 2. In order to grant permissions to groups in Gen 2, please refer to https://docs.amplify.aws/react/build-a-backend/storage/authorization/#for-gen-1-public-protected-and-private-access-pattern. */

export const storage = defineStorage({
  name: `mediavault40471086845d4f7baa5271e2a416b533c0af8-${branchName}`,
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['write', 'read', 'delete']),
      allow.groups(['Admin']).to(['write', 'read', 'delete']),
      allow.groups(['Basic']).to(['read']),
      allow.resource(thumbnailgen).to(['read', 'write', 'delete']),
    ],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
      allow.groups(['Admin']).to(['write', 'read', 'delete']),
      allow.groups(['Basic']).to(['read']),
      allow.resource(thumbnailgen).to(['read', 'write', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
      allow.groups(['Admin']).to(['write', 'read', 'delete']),
      allow.groups(['Basic']).to(['read']),
      allow.resource(thumbnailgen).to(['read', 'write', 'delete']),
    ],
  }),
});
