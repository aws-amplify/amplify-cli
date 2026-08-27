import * as auth from './auth/resource';
import * as storelocator41a9495f41a9495fPostConfirmation from './function/storelocator41a9495f41a9495fPostConfirmation/resource';
import * as geo from './geo/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  auth: auth.auth,
  storelocator41a9495f41a9495fPostConfirmation:
    storelocator41a9495f41a9495fPostConfirmation.storelocator41a9495f41a9495fPostConfirmation,
});

export type Backend = typeof backend;

backend.auth.resources.userPool.grant(
  backend.storelocator41a9495f41a9495fPostConfirmation.resources.lambda,
  'cognito-idp:AdminAddUserToGroup',
  'cognito-idp:CreateGroup',
  'cognito-idp:GetGroup'
);
geo.defineGeo(backend);

auth.applyEscapeHatches(backend);
storelocator41a9495f41a9495fPostConfirmation.applyEscapeHatches(backend);

export function postRefactor() {
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
