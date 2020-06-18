import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import _ from 'lodash';
import { hashElement } from 'folder-hash';
import { getLayerMetadataFactory } from './layerParams';
import { createLayerParametersFile, updateLayerCfnFile } from './storeResources';

export async function packageLayer(context, resource) {
  const backendPath = context.amplify.pathManager.getBackendDirPath();
  const resourcePath = path.join(backendPath, resource.category, resource.resourceName);
  const layerData = getLayerMetadataFactory(backendPath)(resource.resourceName);
  let latestVersion: number = layerData.getLatestVersion();
  const curLayerHash = await hashLayerDir(resourcePath);
  const previousHash = layerData.getHash(latestVersion);
  const layerParameters = context.amplify.readJsonFile(path.join(resourcePath, 'layer-parameters.json'));

  if (previousHash && previousHash !== curLayerHash.hash) {
    ++latestVersion; // Content changes detected, bumping version
    layerParameters.layerVersionMap[`${latestVersion}`] = {
      permissions: [{ type: 'private' }],
      hash: curLayerHash.hash,
    };
    createLayerParametersFile(context, layerParameters, resourcePath);
    layerParameters.layerName = resource.resourceName;
    layerParameters.build = true;
    updateLayerCfnFile(context, layerParameters, resourcePath);
  } else if (!previousHash) {
    layerParameters.layerVersionMap[`${latestVersion}`].hash = curLayerHash;
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

    const libPath = path.join(resourcePath, 'lib', '*');
    const optPath = path.join(resourcePath, 'opt');
    zip.pipe(output);
    [...glob.sync(optPath), ...glob.sync(libPath)]
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
  return await hashElement(layerPath, hashOptions).catch(error => {
    throw new Error(`Hashing the layer directory failed: ${path}`);
  });
}

function validFilesize(path, maxSize = 250) {
  try {
    const { size } = fs.statSync(path);
    const fileSize = Math.round(size / 1024 ** 2);
    return fileSize < maxSize;
  } catch (error) {
    return new Error(`Calculating file size failed: ${path}`);
  }
}
