import * as auth from './auth/resource';
import * as storelocator41a9495f41a9495fPostConfirmation from './function/storelocator41a9495f41a9495fPostConfirmation/resource';
import * as geo from './geo/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  storelocator41a9495f41a9495fPostConfirmation:
    storelocator41a9495f41a9495fPostConfirmation.storelocator41a9495f41a9495fPostConfirmation,
});

export type Backend = typeof backend;

geo.defineGeo(backend);

export function postRefactor() {}

auth.applyEscapeHatches(backend);
storelocator41a9495f41a9495fPostConfirmation.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();

// Uncomment post refactor to force a redeployment
// Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
