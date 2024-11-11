import { auth } from './auth/resource';
import { defineBackend } from '@aws-amplify/backend';
const backend = defineBackend({
  auth,
});
