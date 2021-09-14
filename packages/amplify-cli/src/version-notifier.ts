import { JSONUtilities, $TSAny, isPackaged } from 'amplify-cli-core';
import { default as updateNotifier } from 'update-notifier';
import path from 'path';
import chalk from 'chalk';

const pkg = JSONUtilities.readJson<$TSAny>(path.join(__dirname, '..', 'package.json'));
const notifier = updateNotifier({ pkg }); // defaults to 1 day interval

const defaultOpts: updateNotifier.NotifyOptions = {
  message: isPackaged ? `Update available:\nRun ${chalk.blueBright('amplify upgrade')} for the latest features and fixes!` : undefined,
};
export function notify(notifyOpts?: updateNotifier.NotifyOptions): void {
  notifyOpts = { ...defaultOpts, ...notifyOpts };
  notifier.notify(notifyOpts);
}
