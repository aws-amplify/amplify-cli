import { defineStorage } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `discus-avatarsc39a5-${branchName}`,
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
