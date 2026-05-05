import * as data from './data/resource';
import * as auth from './auth/resource';
import * as customfinance from './custom/customfinance/resource';
import * as customresolver from './custom/customresolver/resource';
import * as financetracker from './function/financetracker/resource';
import * as storage from './storage/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';

const backend = defineBackend({
  data: data.data,
  auth: auth.auth,
  financetracker: financetracker.financetracker,
  storage: storage.storage,
});

export type Backend = typeof backend;

customfinance.defineCustomfinance(backend);
customresolver.defineCustomresolver(backend);

data.applyEscapeHatches(backend);
auth.applyEscapeHatches(backend);
financetracker.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);

export function postRefactor() {
  storage.postRefactor(backend);
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
