import path from 'path';
import glob from 'glob';
import archiver from 'archiver';
import fs from 'fs-extra';

export function packageLayer(context, resource) {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), resource.category, resource.resourceName);
  const zipFilename = 'latest-build.zip';

  const distDir = path.join(resourcePath, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir);
  }
  const destination = path.join(distDir, zipFilename);
  const zip = archiver.create('zip');
  const output = fs.createWriteStream(destination);
  return new Promise((resolve, reject) => {
    output.on('close', () => {
      // check zip size is less than 250MB
      if (validFilesize(destination)) {
        const zipName = `${resource.resourceName}-build.zip`;
        context.amplify.updateAmplifyMetaAfterPackage(resource, zipName);
        resolve({ zipFilePath: destination, zipFilename: zipName });
      } else {
        reject(new Error('File size greater than 250MB'));
      }
    });
    output.on('error', () => {
      reject(new Error('Failed to zip code.'));
    });

    zip.pipe(output);
    glob
      .sync(resourcePath + '/lib/*')
      .filter(folder => fs.lstatSync(folder).isDirectory())
      .forEach(folder => zip.directory(folder, path.basename(folder)));
    zip.finalize();
  });
}

function validFilesize(path, maxSize = 250) {
  try {
    const { size } = fs.statSync(path);
    const fileSize = Math.round(size / 1024 ** 2);
    return fileSize < maxSize;
  } catch (error) {
    return new Error('error in calculating File size');
  }
}
