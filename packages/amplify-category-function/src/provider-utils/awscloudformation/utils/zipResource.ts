import { ZipEntry } from 'amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import archiver from 'archiver';

export const zipPackage = (zipEntries: ZipEntry[], packageFileName: string): Promise<string> => {
  if (zipEntries && zipEntries.length) {
    const file = fs.createWriteStream(packageFileName);
    const zip = archiver.create('zip', {});
    return new Promise((resolve, reject) => {
      file.on('close', () => {
        resolve('Successfully zipped');
      });
      file.on('error', err => {
        reject(new Error(`Failed to zip with error: [${err}]`));
      });
      zip.pipe(file);
      zipEntries.forEach(entry => {
        if (entry.sourceFolder) {
          zip.glob('**/*', {
            cwd: entry.sourceFolder,
            ignore: entry.ignoreFiles,
            dot: true,
          });
        }
        if (entry.packageFolder) {
          zip.directory(entry?.packageFolder, false);
        }
      });
      zip.finalize();
    });
  }
  return undefined;
};
