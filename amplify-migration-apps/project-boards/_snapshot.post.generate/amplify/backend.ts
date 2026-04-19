import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as quotegenerator from './function/quotegenerator/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  quotegenerator: quotegenerator.quotegenerator,
});

export type Backend = typeof backend;

export function postRefactor() {
  storage.postRefactor(backend);
}

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
quotegenerator.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();
