import { auth, escape as escapeAuth } from './auth/resource';
import { data, escape as escapeData } from './data/resource';
import { fitnesstracker33f5545533f55455PreSignup, escape as escapeFitnesstracker33f5545533f55455PreSignup } from './auth/fitnesstracker33f5545533f55455PreSignup/resource';
import { lognutrition, escape as escapeLognutrition } from './function/lognutrition/resource';
import { admin, escape as escapeAdmin } from './function/admin/resource';
import { defineNutritionApi } from './api/nutritionapi/resource';
import { defineAdminApi } from './api/adminapi/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth,
  data,
  fitnesstracker33f5545533f55455PreSignup,
  lognutrition,
  admin,
});

export type Backend = typeof backend;

// Use CDK to create resources not natively supported by Gen2
defineNutritionApi(backend);
defineAdminApi(backend);

// Use CDK escape hatches for features not natively supported in Gen2
escapeAuth(backend);
escapeFitnesstracker33f5545533f55455PreSignup(backend);
escapeLognutrition(backend);
escapeData(backend);
escapeAdmin(backend);
