import { defineStorage } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `productcatalogd4ffc6fd926f4285b3a12edc8e7c883ef086b-${branchName}`,
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
