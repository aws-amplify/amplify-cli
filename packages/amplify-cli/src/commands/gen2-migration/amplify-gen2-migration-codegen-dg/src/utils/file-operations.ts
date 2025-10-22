// File and directory operations utilities
import * as fs from 'fs/promises';
import * as path from 'path';

export const ensureDirectory = async (dirPath: string): Promise<void> => {
  await fs.mkdir(dirPath, { recursive: true });
};

export const writeFile = async (filePath: string, content: string): Promise<void> => {
  await ensureDirectory(path.dirname(filePath));
  await fs.writeFile(filePath, content);
};
