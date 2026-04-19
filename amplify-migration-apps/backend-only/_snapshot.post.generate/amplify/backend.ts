import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as quotegeneratorbe from './function/quotegeneratorbe/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  quotegeneratorbe: quotegeneratorbe.quotegeneratorbe,
});

export type Backend = typeof backend;

export function postRefactor() {
  storage.postRefactor(backend);
}

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
quotegeneratorbe.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();
