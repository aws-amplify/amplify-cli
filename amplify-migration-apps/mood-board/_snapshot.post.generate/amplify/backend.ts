import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as moodboardGetRandomEmoji from './function/moodboardGetRandomEmoji/resource';
import * as moodboardKinesisReader from './function/moodboardKinesisReader/resource';
import * as moodboardKinesisTrigger from './function/moodboardKinesisTrigger/resource';
import * as analytics from './analytics/resource';
import { defineBackend } from '@aws-amplify/backend';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  moodboardGetRandomEmoji: moodboardGetRandomEmoji.moodboardGetRandomEmoji,
  moodboardKinesisReader: moodboardKinesisReader.moodboardKinesisReader,
  moodboardKinesisTrigger: moodboardKinesisTrigger.moodboardKinesisTrigger,
});

const analyticsResult = analytics.defineAnalytics(backend);

export type Backend = typeof backend;

export function postRefactor(backend: Backend) {
  storage.postRefactor(backend);
  analytics.postRefactor(analyticsResult);
}

export function applyEscapeHatches(backend: Backend) {
  auth.applyEscapeHatches(backend);
  data.applyEscapeHatches(backend);
  storage.applyEscapeHatches(backend);
  moodboardGetRandomEmoji.applyEscapeHatches(backend);
  moodboardKinesisReader.applyEscapeHatches(backend, analyticsResult);
  moodboardKinesisTrigger.applyEscapeHatches(backend, analyticsResult);
}

applyEscapeHatches(backend);

// Uncomment after refactor
// postRefactor(backend);
