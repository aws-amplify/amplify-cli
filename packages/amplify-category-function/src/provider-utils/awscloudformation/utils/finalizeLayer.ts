import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import { prompt } from 'inquirer';
import path from 'path';
import _ from 'lodash';
import { hashElement } from 'folder-hash';
import { ServiceName } from './constants';
import { prevPermsQuestion } from './layerHelpers';
import { getLayerMetadataFactory, LayerPermission, Permission, PrivateLayer } from './layerParams';
import { createLayerParametersFile, updateLayerCfnFile } from './storeResources';

export async function finalizeLayer(context, resource: Resource) {
  const layerName = resource.resourceName;
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), resource.category, layerName);
  await ensureLayerVersion(context, resourcePath, layerName);
  return packageLayer(context, resource);
}

async function packageLayer(context, resource: Resource) {
  const layerName = resource.resourceName;
  const resourcePath = path.join(context.amplify.pathManager.getBackendDirPath(), resource.category, layerName);
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
        const zipName = `${layerName}-build.zip`;
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

// Check hash results for content changes, bump version if so
async function ensureLayerVersion(context: any, layerPath: string, layerName: string) {
  const layerData = getLayerMetadataFactory(context)(layerName);
  let latestVersion: number = layerData.getLatestVersion();
  const { hash: currentHash } = await hashLayerDir(layerPath);
  const previousHash = layerData.getHash(latestVersion);
  const layerParameters = context.amplify.readJsonFile(path.join(layerPath, 'layer-parameters.json'));

  if (previousHash && previousHash !== currentHash) {
    const prevPermissions = layerData.getVersion(latestVersion).permissions;
    ++latestVersion; // Content changes detected, bumping version
    layerParameters.layerVersionMap[`${latestVersion}`] = {
      permissions: await getNewVersionPermissions(context.print, layerName, prevPermissions),
      hash: currentHash,
    };
    createLayerParametersFile(context, layerParameters, layerPath);
    layerParameters.layerName = layerName;
    layerParameters.build = true;
    updateLayerCfnFile(context, layerParameters, layerPath);
  } else if (!previousHash) {
    layerParameters.layerVersionMap[`${latestVersion}`].hash = currentHash;
    createLayerParametersFile(context, layerParameters, layerPath);
  }
}

async function getNewVersionPermissions(
  print: any,
  layerName: string,
  prevPermissions: Partial<LayerPermission>[],
): Promise<Partial<LayerPermission>[]> {
  const defaultPermissions: PrivateLayer[] = [{ type: Permission.private }];
  let usePrevPermissions = true;
  if (!_.isEqual(prevPermissions, defaultPermissions)) {
    print.success(`Content changes in Lambda layer ${layerName} detected:`);
    print.warning('Note: You need to run "amplify update function" to configure your functions with the latest layer version.');
    const { usePrevPerms } = await prompt(prevPermsQuestion(layerName));
    usePrevPermissions = usePrevPerms === 'previous';
  }
  return usePrevPermissions ? prevPermissions : defaultPermissions;
}

async function hashLayerDir(layerPath: string): Promise<any> {
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

interface Resource {
  service: ServiceName;
  dependsOn?: object[];
  resourceName: string;
  category: string;
}
