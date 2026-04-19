import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as storageActivity from './storage/activity/resource';
import * as storageBookmarks from './storage/bookmarks/resource';
import * as fetchuseractivity from './function/fetchuseractivity/resource';
import * as recorduseractivity from './function/recorduseractivity/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  fetchuseractivity: fetchuseractivity.fetchuseractivity,
  recorduseractivity: recorduseractivity.recorduseractivity,
});

export type Backend = typeof backend;

const activity = storageActivity.defineStorageActivity(backend);
const bookmarks = storageBookmarks.defineStorageBookmarks(backend);

export function postRefactor() {
  storage.postRefactor(backend);
  storageActivity.postRefactor(activity);
  storageBookmarks.postRefactor(bookmarks);
}

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
fetchuseractivity.applyEscapeHatches(backend);
recorduseractivity.applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor();
