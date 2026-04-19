import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as S3Trigger1ef46783 from './function/S3Trigger1ef46783/resource';
import * as lowstockproducts from './function/lowstockproducts/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  S3Trigger1ef46783: S3Trigger1ef46783.S3Trigger1ef46783,
  lowstockproducts: lowstockproducts.lowstockproducts,
});

export type Backend = typeof backend;

export function postRefactor(backend: Backend) {
  storage.postRefactor(backend);
}

export function applyEscapeHatches(backend: Backend) {
  auth.applyEscapeHatches(backend);
  data.applyEscapeHatches(backend);
  storage.applyEscapeHatches(backend);
  S3Trigger1ef46783.applyEscapeHatches(backend);
  lowstockproducts.applyEscapeHatches(backend);
}

applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor(backend);
