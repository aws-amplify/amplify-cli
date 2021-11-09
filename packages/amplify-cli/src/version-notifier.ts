import { $TSAny, isPackaged } from 'amplify-cli-core';
import { default as updateNotifier } from 'update-notifier';
import chalk from 'chalk';
import { readCLIPackageJson } from './version-gating';

const pkg = readCLIPackageJson<$TSAny>();
const notifier = updateNotifier({ pkg }); // defaults to 1 day interval

const defaultOpts: updateNotifier.NotifyOptions = {
  message: isPackaged ? `Update available:\nRun ${chalk.blueBright('amplify upgrade')} for the latest features and fixes!` : undefined,
};

export function notify(notifyOpts?: updateNotifier.NotifyOptions): void {
  notifyOpts = { ...defaultOpts, ...notifyOpts };

  notifier.notify(notifyOpts);
}
