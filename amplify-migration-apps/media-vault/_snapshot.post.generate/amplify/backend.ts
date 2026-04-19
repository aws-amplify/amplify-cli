import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as thumbnailgen from './function/thumbnailgen/resource';
import * as addusertogroup from './function/addusertogroup/resource';
import * as removeuserfromgroup from './function/removeuserfromgroup/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  thumbnailgen: thumbnailgen.thumbnailgen,
  addusertogroup: addusertogroup.addusertogroup,
  removeuserfromgroup: removeuserfromgroup.removeuserfromgroup,
});

export type Backend = typeof backend;

export function postRefactor() {
  storage.postRefactor(backend);
}

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
thumbnailgen.applyEscapeHatches(backend);
addusertogroup.applyEscapeHatches(backend);
removeuserfromgroup.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();
