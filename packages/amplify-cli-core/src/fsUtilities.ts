import ncp from 'ncp';
import { CopyOptions } from 'fs-extra';

/**
 * Uses ncp to copy files because it doesn't use fs.copyFile under the hood. fs.copyFile does not work with pkg: https://github.com/vercel/pkg/issues/420
 * Once that issue is resolved, we should be able to use fs.copy() here
 *
 * To allow this to be a drop-in replacement for fs.copy operations, this function takes in fs CopyOptions and translates them to ncp options
 * (currently just translating the 'overwrite' flag because that's all that we use)
 * @param source source directory or file
 * @param destination destination directory or file
 */
export const copy = (source: string, destination: string, options: Pick<CopyOptions, 'overwrite'> = {}) =>
  new Promise<void>((resolve, reject) => {
    ncp(source, destination, translateOptions(options), err => (err ? reject(err) : resolve()));
  });

const translateOptions = (options: CopyOptions): ncp.Options => ({
  clobber: options.overwrite,
});
