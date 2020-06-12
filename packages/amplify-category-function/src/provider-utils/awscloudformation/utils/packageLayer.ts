import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import _ from 'lodash';
import { createLayerParametersFile } from './storeResources';
import { hashElement } from 'folder-hash';

export async function packageLayer(context, resource) {
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), resource.category, resource.resourceName);
  const layerHash = await hashLayerDir(resourcePath);
  const layerParameters = context.amplify.readJsonFile(path.join(resourcePath, 'layer-parameters.json'));
  const versions = Object.keys(layerParameters.layerVersionMap).sort();
  let latestVersion = versions.length; // versions start at 1, so versions[i] === String(i + 1)
  const previousHash = _.get(layerParameters, ['layerVersionMap', `${latestVersion}`, 'hash'], null);

  if (previousHash && previousHash !== layerHash.hash) {
    ++latestVersion; // Content changes detected, bumping version
    layerParameters.layerVersionMap[`${latestVersion}`] = {
      permissions: [{ type: 'private' }],
      hash: layerHash.hash,
    };
    createLayerParametersFile(context, layerParameters, resourcePath);
  } else if (!previousHash) {
    _.assign(layerParameters.layerVersionMap[`${latestVersion}`], { hash: layerHash.hash });
    createLayerParametersFile(context, layerParameters, resourcePath);
  }

  const zipFilename = 'latest-build.zip';

  const distDir = path.join(resourcePath, 'dist');
  fs.ensureDirSync(distDir);
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

export async function hashLayerDir(layerPath: string): Promise<any> {
  const hashOptions = {
    folders: { exclude: ['.*', 'dist'] },
    files: { exclude: ['README.txt', 'layer-parameters.json', 'parameters.json', '*-awscloudformation-template.json'] },
  };
  let currentLayerDirHash: string;
  await hashElement(layerPath, hashOptions)
    .then(hash => {
      currentLayerDirHash = hash;
    })
    .catch(error => {
      throw new Error(`Hashing the layer directory ${path} failed`);
    });
  return currentLayerDirHash;
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
