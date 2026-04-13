import { defineStorage } from '@aws-amplify/backend';

const dc72c1d108.deploymentTypeName = process.env.AWS_BRANCH ?? 'sandbox';

export const storage = defineStorage({
  name: `projectboards34b9a7f3c2ca489293910116c994688b02940-${dc72c1d108.deploymentTypeName}`,
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
