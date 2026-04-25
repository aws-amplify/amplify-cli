import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as quotegenerator from './function/quotegenerator/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  quotegenerator: quotegenerator.quotegenerator,
});

export type Backend = typeof backend;

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
quotegenerator.applyEscapeHatches(backend);

export function postRefactor() {
  storage.postRefactor(backend);
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
