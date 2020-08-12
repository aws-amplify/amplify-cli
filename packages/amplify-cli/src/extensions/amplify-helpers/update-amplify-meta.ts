import * as fs from 'fs-extra';
import * as path from 'path';
import { hashElement } from 'folder-hash';
import { updateBackendConfigAfterResourceAdd, updateBackendConfigAfterResourceUpdate } from './update-backend-config';
import { readJsonFile } from './read-json-file';
import {
  getAmplifyMetaFilePath,
  getCurrentAmplifyMetaFilePath,
  getBackendConfigFilePath,
  getCurrentBackendConfigFilePath,
  getBackendDirPath,
  getCurrentCloudBackendDirPath,
} from './path-manager';
import { copy } from 'amplify-cli-core';

export function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timeStamp) {
  const amplifyMeta = readJsonFile(filePath);

  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
    amplifyMeta[category][resourceName] = {};
  } else if (!amplifyMeta[category][resourceName]) {
    amplifyMeta[category][resourceName] = {};
  }
  if (!amplifyMeta[category][resourceName][attribute]) {
    amplifyMeta[category][resourceName][attribute] = {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (!amplifyMeta[category][resourceName][attribute]) {
      amplifyMeta[category][resourceName][attribute] = {};
    }
    Object.assign(amplifyMeta[category][resourceName][attribute], value);
  } else {
    amplifyMeta[category][resourceName][attribute] = value;
  }
  if (timeStamp) {
    amplifyMeta[category][resourceName].lastPushTimeStamp = timeStamp;
  }

  const jsonString = JSON.stringify(amplifyMeta, null, 4);

  fs.writeFileSync(filePath, jsonString, 'utf8');

  return amplifyMeta;
}

async function moveBackendResourcesToCurrentCloudBackend(resources) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  const amplifyCloudMetaFilePath = getCurrentAmplifyMetaFilePath();
  const backendConfigFilePath = getBackendConfigFilePath();
  const backendConfigCloudFilePath = getCurrentBackendConfigFilePath();

  for (let i = 0; i < resources.length; i += 1) {
    const sourceDir = path.normalize(path.join(getBackendDirPath(), resources[i].category, resources[i].resourceName));

    const targetDir = path.normalize(path.join(getCurrentCloudBackendDirPath(), resources[i].category, resources[i].resourceName));

    if (fs.pathExistsSync(targetDir)) {
      fs.removeSync(targetDir);
    }

    fs.ensureDirSync(targetDir);

    await copy(sourceDir, targetDir);
  }

  await copy(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
  await copy(backendConfigFilePath, backendConfigCloudFilePath, { overwrite: true });
}

export function updateamplifyMetaAfterResourceAdd(category, resourceName, options: { dependsOn? } = {}) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  if (options.dependsOn) {
    checkForCyclicDependencies(category, resourceName, options.dependsOn);
  }

  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
  }
  if (amplifyMeta[category][resourceName]) {
    throw new Error(`${resourceName} is present in amplify-meta.json`);
  }
  amplifyMeta[category][resourceName] = {};
  amplifyMeta[category][resourceName] = options;
  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  updateBackendConfigAfterResourceAdd(category, resourceName, options);
}

export function updateProvideramplifyMeta(providerName, options) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();

  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  if (!amplifyMeta.providers) {
    amplifyMeta.providers = {};
    amplifyMeta.providers[providerName] = {};
  } else if (!amplifyMeta.providers[providerName]) {
    amplifyMeta.providers[providerName] = {};
  }

  Object.keys(options).forEach(key => {
    amplifyMeta.providers[providerName][key] = options[key];
  });

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

export function updateamplifyMetaAfterResourceUpdate(category, resourceName, attribute, value) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  // let amplifyCloudMetaFilePath = getCurrentAmplifyMetaFilePath();
  const currentTimestamp = new Date();
  if (attribute === 'dependsOn') {
    checkForCyclicDependencies(category, resourceName, value);
  }
  const updatedMeta = updateAwsMetaFile(amplifyMetaFilePath, category, resourceName, attribute, value, currentTimestamp);
  if (['dependsOn', 'service'].includes(attribute)) {
    updateBackendConfigAfterResourceUpdate(category, resourceName, attribute, value);
  }

  return updatedMeta;
}

export async function updateamplifyMetaAfterPush(resources) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);

  const currentTimestamp = new Date();
  let sourceDir;

  for (let i = 0; i < resources.length; i += 1) {
    sourceDir = path.normalize(path.join(getBackendDirPath(), resources[i].category, resources[i].resourceName));
    const hashDir = await getHashForResourceDir(sourceDir);

    /*eslint-disable */
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushTimeStamp = currentTimestamp;
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushDirHash = hashDir;
    /* eslint-enable */
  }

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  await moveBackendResourcesToCurrentCloudBackend(resources);
}

function getHashForResourceDir(dirPath) {
  const options = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage'] },
  };

  return hashElement(dirPath, options).then(result => result.hash);
}

export function updateamplifyMetaAfterBuild(resource) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  const currentTimestamp = new Date();
  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastBuildTimeStamp = currentTimestamp;
  /* eslint-enable */

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

export function updateAmplifyMetaAfterPackage(resource, zipFilename) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  const currentTimestamp = new Date();
  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastPackageTimeStamp = currentTimestamp;
  amplifyMeta[resource.category][resource.resourceName].distZipFilename = zipFilename;
  /* eslint-enable */

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

export function updateamplifyMetaAfterResourceDelete(category, resourceName) {
  const amplifyMetaFilePath = getCurrentAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);

  const resourceDir = path.normalize(path.join(getCurrentCloudBackendDirPath(), category, resourceName));

  if (amplifyMeta[category] && amplifyMeta[category][resourceName] !== undefined) {
    delete amplifyMeta[category][resourceName];
  }

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  fs.removeSync(resourceDir);
}

function checkForCyclicDependencies(category, resourceName, dependsOn: [{ category; resourceName }]) {
  const amplifyMetaFilePath = getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  let cyclicDependency: Boolean = false;

  if (dependsOn) {
    dependsOn.forEach(resource => {
      if (resource.category === category && resource.resourceName === resourceName) {
        cyclicDependency = true;
      }
      if (amplifyMeta[resource.category] && amplifyMeta[resource.category][resource.resourceName]) {
        const dependsOnResourceDependency = amplifyMeta[resource.category][resource.resourceName].dependsOn;
        if (dependsOnResourceDependency) {
          dependsOnResourceDependency.forEach(dependsOnResource => {
            if (dependsOnResource.category === category && dependsOnResource.resourceName === resourceName) {
              cyclicDependency = true;
            }
          });
        }
      }
    });
  }

  if (cyclicDependency === true) {
    throw new Error(`Cannot add ${resourceName} due to a cyclic dependency`);
  }
}
