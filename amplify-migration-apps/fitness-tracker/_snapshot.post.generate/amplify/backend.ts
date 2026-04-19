import { auth } from './auth/resource';
import { data } from './data/resource';
import { fitnesstracker33f5545533f55455PreSignup } from './function/fitnesstracker33f5545533f55455PreSignup/resource';
import { lognutrition } from './function/lognutrition/resource';
import { admin } from './function/admin/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth,
  data,
  fitnesstracker33f5545533f55455PreSignup,
  lognutrition,
  admin,
});

export type Backend = typeof backend;
