import opn from 'open';
import { ChildProcess } from 'child_process';
import { isCI } from '..';

/**
 * Helper function to Open stuff like URLs, files, executables. Cross-platform and opens only if its run in non-ci environmets
 * This is wrapper for https://github.com/sindresorhus/open
 * @param target The thing you want to open. Can be a URL, file, or executable.
 * @param options opn.Options
 */
export const open = async (target: string, options: opn.Options): Promise<ChildProcess | void> => {
  if (isCI()) {
    return Promise.resolve();
  }
  let childProcess: ChildProcess;
  try {
    childProcess = await opn(target, options);
    childProcess.on('error', (e) => handleOpenError(e, target));
  } catch (e) {
    handleOpenError(e, target);
    return Promise.resolve();
  }
  return Promise.resolve(childProcess);
};

const handleOpenError = (err: Error, target: string) => {
  console.error(`Unable to open ${target}: ${err.message}`);
  if ('code' in err && err['code'] === 'ENOENT') {
    console.warn('Have you installed `xdg-utils` on your machine?');
  }
};
