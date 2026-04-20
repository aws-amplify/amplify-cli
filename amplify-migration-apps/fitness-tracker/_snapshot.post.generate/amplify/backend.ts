import * as auth from './auth/resource';
import * as data from './data/resource';
import * as fitnesstracker33f5545533f55455PreSignup from './function/fitnesstracker33f5545533f55455PreSignup/resource';
import * as lognutrition from './function/lognutrition/resource';
import * as admin from './function/admin/resource';
import * as nutritionapi from './api/nutritionapi/resource';
import * as adminapi from './api/adminapi/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  fitnesstracker33f5545533f55455PreSignup:
    fitnesstracker33f5545533f55455PreSignup.fitnesstracker33f5545533f55455PreSignup,
  lognutrition: lognutrition.lognutrition,
  admin: admin.admin,
});

export type Backend = typeof backend;

export function postRefactor() {}

nutritionapi.defineNutritionApi(backend);
adminapi.defineAdminApi(backend);

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
fitnesstracker33f5545533f55455PreSignup.applyEscapeHatches(backend);
lognutrition.applyEscapeHatches(backend);
admin.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();
