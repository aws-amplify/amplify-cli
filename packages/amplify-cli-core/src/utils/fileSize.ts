import globby from 'globby';
import * as fs from 'fs-extra';

export const convertNumBytes = (numBytes: number) => ({
  toKB: () => Math.round(numBytes / 1024),
  toMB: () => Math.round(numBytes / 1024 ** 2),
});

export async function getFolderSize(filePaths: string | string[]) {
  const paths = await globby(filePaths, { followSymbolicLinks: false });
  let totalSizeInBytes = 0;
  for (const path of paths) {
    try {
      const { size } = await fs.stat(path);
      totalSizeInBytes += size;
    } catch (error) {
      // skip file in size calculation
    }
  }
  return totalSizeInBytes;
}
