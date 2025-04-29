import fs from 'node:fs/promises';
export const fileOrDirectoryExists = async (targetPath: string): Promise<boolean> => {
  return fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false);
};
