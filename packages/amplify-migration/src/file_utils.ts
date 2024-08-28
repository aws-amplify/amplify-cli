import fs from 'node:fs/promises';

export const fileOrDirectoryExists = async (targetPath: string): Promise<boolean> => {
  return fs
    .access(targetPath)
    .then(() => true)
    .catch(() => false);
};

export const readJsonFile = async (filePath: string) => {
  const contents = await fs.readFile(filePath, { encoding: 'utf8' });
  return JSON.parse(contents);
};
