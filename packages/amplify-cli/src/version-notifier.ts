import { JSONUtilities, $TSAny } from 'amplify-cli-core';
import { default as updateNotifier } from 'update-notifier';
import path from 'path';

const pkg = JSONUtilities.readJson<$TSAny>(path.join(__dirname, '..', 'package.json'));
const notifier = updateNotifier({ pkg }); // defaults to 1 day interval

export function notify(customMessage?: updateNotifier.NotifyOptions): void {
  notifier.notify(customMessage);
}
