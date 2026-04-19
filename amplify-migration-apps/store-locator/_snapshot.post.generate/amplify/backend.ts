import * as auth from './auth/resource';
import * as storelocator41a9495f41a9495fPostConfirmation from './function/storelocator41a9495f41a9495fPostConfirmation/resource';
import * as geo from './geo/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  storelocator41a9495f41a9495fPostConfirmation: storelocator41a9495f41a9495fPostConfirmation.storelocator41a9495f41a9495fPostConfirmation,
});

geo.defineGeo(backend);

export type Backend = typeof backend;

export function applyEscapeHatches(backend: Backend) {
  auth.applyEscapeHatches(backend);
  storelocator41a9495f41a9495fPostConfirmation.applyEscapeHatches(backend);
}

applyEscapeHatches(backend);
