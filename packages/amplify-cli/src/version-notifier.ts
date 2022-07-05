import { JSONUtilities, $TSAny, isPackaged } from 'amplify-cli-core';
import path from 'path';
import chalk from 'chalk';

import * as updateNotifier from 'update-notifier';

const pkg = JSONUtilities.readJson<$TSAny>(path.join(__dirname, '..', 'package.json'));
const notifier = updateNotifier.default({ pkg }); // defaults to 1 day interval

const defaultOpts: updateNotifier.NotifyOptions = {
  message: isPackaged ? `Update available:\nRun ${chalk.blueBright('amplify upgrade')} for the latest features and fixes!` : undefined,
};
/**
 * notifies to upgrade pkg cli version
 */
export const notify = (notifyOpts?: updateNotifier.NotifyOptions): void => {
  // eslint-disable-next-line no-param-reassign
  notifyOpts = { ...defaultOpts, ...notifyOpts };
  notifier.notify(notifyOpts);
};
