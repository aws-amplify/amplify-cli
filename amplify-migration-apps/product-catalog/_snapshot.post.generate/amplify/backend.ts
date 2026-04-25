import * as auth from './auth/resource';
import * as data from './data/resource';
import * as S3Trigger1ef46783 from './function/S3Trigger1ef46783/resource';
import * as lowstockproducts from './function/lowstockproducts/resource';
import * as storage from './storage/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  S3Trigger1ef46783: S3Trigger1ef46783.S3Trigger1ef46783,
  lowstockproducts: lowstockproducts.lowstockproducts,
  storage: storage.storage,
});

export type Backend = typeof backend;

export function postRefactor() {
  storage.postRefactor(backend);
}

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
S3Trigger1ef46783.applyEscapeHatches(backend);
lowstockproducts.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();

// Uncomment post refactor to force a redeployment
// Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
