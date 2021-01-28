import open from 'open';
import ciInfo from 'ci-info';
import { ChildProcess } from 'child_process';

/**
 * Helper function to Open stuff like URLs, files, executables. Cross-platform and opens only if its run in non-ci environmets
 * This is wrapper for https://github.com/sindresorhus/open
 * @param target The thing you want to open. Can be a URL, file, or executable.
 * @param options
 */
export const openIfNotCI = (target: string, options: open.Options): Promise<ChildProcess | void> => {
  if (!ciInfo.isCI) {
    return open(target, options);
  }
  return Promise.resolve();
};
