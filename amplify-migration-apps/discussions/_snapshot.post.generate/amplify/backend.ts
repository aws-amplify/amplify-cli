import * as data from './data/resource';
import * as auth from './auth/resource';
import * as fetchuseractivity from './function/fetchuseractivity/resource';
import * as recorduseractivity from './function/recorduseractivity/resource';
import * as activityTrigger from './function/activityTrigger/resource';
import * as storageActivity from './storage/activity/resource';
import * as storage from './storage/resource';
import * as storageBookmarks from './storage/bookmarks/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  data: data.data,
  auth: auth.auth,
  fetchuseractivity: fetchuseractivity.fetchuseractivity,
  recorduseractivity: recorduseractivity.recorduseractivity,
  activityTrigger: activityTrigger.activityTrigger,
  storage: storage.storage,
});

export type Backend = typeof backend;

const activity = storageActivity.defineStorageActivity(backend);
const bookmarks = storageBookmarks.defineStorageBookmarks(backend);

export function postRefactor() {
  storageActivity.postRefactor(activity);
  storage.postRefactor(backend);
  storageBookmarks.postRefactor(bookmarks);
}

auth.applyEscapeHatches(backend);
fetchuseractivity.applyEscapeHatches(backend);
recorduseractivity.applyEscapeHatches(backend);
activityTrigger.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();

// Uncomment post refactor to force a redeployment
// Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
