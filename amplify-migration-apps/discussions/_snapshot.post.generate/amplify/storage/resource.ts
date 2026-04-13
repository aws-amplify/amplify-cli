import { defineStorage } from '@aws-amplify/backend';

const da5e56ee3d.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `discus-avatarsc39a5-${da5e56ee3d.deploymentTypeName}`,
  access: (allow) => ({
    'public/*': [allow.authenticated.to(['write', 'read', 'delete'])],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete']),
    ],
  }),
});
