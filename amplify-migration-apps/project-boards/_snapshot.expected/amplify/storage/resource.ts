import { defineStorage } from '@aws-amplify/backend';

const branchName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `projectboardsfe06adf5e87344b59ef17edd21ee3b3c1e851-${branchName}`,
  access: (allow) => ({
    'public/*': [
      allow.guest.to(['read']), 
      allow.authenticated.to(['write', 'read', 'delete'])
    ],
    'protected/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete'])
    ],
    'private/{entity_id}/*': [
      allow.authenticated.to(['write', 'read', 'delete'])
    ],
  }),
});
