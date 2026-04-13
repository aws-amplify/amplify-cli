import { defineStorage } from '@aws-amplify/backend';

const 383edf5091.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `moodboard20e29595008142e3ad16f01c4066e1c41959a-${383edf5091.deploymentTypeName}`,
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
