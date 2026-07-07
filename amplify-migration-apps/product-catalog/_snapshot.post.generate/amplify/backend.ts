import * as auth from './auth/resource';
import * as data from './data/resource';
import * as S3Trigger1ef46783 from './function/S3Trigger1ef46783/resource';
import * as lowstockproducts from './function/lowstockproducts/resource';
import * as storage from './storage/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  S3Trigger1ef46783: S3Trigger1ef46783.S3Trigger1ef46783,
  lowstockproducts: lowstockproducts.lowstockproducts,
  storage: storage.storage,
});

export type Backend = typeof backend;

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
S3Trigger1ef46783.applyEscapeHatches(backend);
lowstockproducts.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);

export function postRefactor() {
  storage.postRefactor(backend);
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
