import { defineStorage } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `backendonlycb1a13ab81664ecaa7d015068ab2d0165e0fa-${branchName}`,
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
