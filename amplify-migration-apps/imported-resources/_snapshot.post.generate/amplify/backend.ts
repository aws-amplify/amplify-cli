import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as importedresourcequotegenerator from './function/importedresourcequotegenerator/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  importedresourcequotegenerator: importedresourcequotegenerator.importedresourcequotegenerator,
});

export type Backend = typeof backend;

export function postRefactor() {
  storage.postRefactor(backend);
}

data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
importedresourcequotegenerator.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();

// Uncomment post refactor to force a redeployment
// Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
