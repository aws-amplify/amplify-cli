import opn from "open";
import { ChildProcess } from "child_process";
import { isCI } from "..";

/**
 * Helper function to Open stuff like URLs, files, executables. Cross-platform and opens only if its run in non-ci environmets
 * This is wrapper for https://github.com/sindresorhus/open
 * @param target The thing you want to open. Can be a URL, file, or executable.
 * @param options opn.Options
 */
export const open = (target: string, options: opn.Options): Promise<ChildProcess | void> => {
  if (isCI()) {
    return Promise.resolve();
  }
  try {
    return opn(target, options);
  } catch (e) {
    console.warn(`Unable to open ${target}: ${(e as Error).message}`);
    return Promise.resolve();
  }
};
