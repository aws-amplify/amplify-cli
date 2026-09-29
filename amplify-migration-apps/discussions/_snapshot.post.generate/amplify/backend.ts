import * as data from './data/resource';
import * as auth from './auth/resource';
import * as fetchuseractivity from './function/fetchuseractivity/resource';
import * as recorduseractivity from './function/recorduseractivity/resource';
import * as activityTrigger from './function/activityTrigger/resource';
import * as storageActivity from './storage/activity/resource';
import * as storage from './storage/resource';
import * as storageBookmarks from './storage/bookmarks/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';

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

auth.applyEscapeHatches(backend);
fetchuseractivity.applyEscapeHatches(backend, activity);
recorduseractivity.applyEscapeHatches(backend, activity);
activityTrigger.applyEscapeHatches(backend, activity);
storage.applyEscapeHatches(backend);

export function postRefactor() {
  storageActivity.postRefactor(activity);
  storage.postRefactor(backend);
  storageBookmarks.postRefactor(bookmarks);
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
