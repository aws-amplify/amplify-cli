import * as fs from 'fs-extra';
import * as path from 'path';
import { hashElement } from 'folder-hash';
import { updateBackendConfigAfterResourceAdd, updateBackendConfigAfterResourceUpdate } from './update-backend-config';
import { JSONUtilities, $TSMeta, pathManager, stateManager } from 'amplify-cli-core';

export function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timestamp) {
  const amplifyMeta = JSONUtilities.readJson<$TSMeta>(filePath);

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
  if (timestamp) {
    amplifyMeta[category][resourceName].lastPushTimeStamp = timestamp;
  }

  JSONUtilities.writeJson(filePath, amplifyMeta);

  return amplifyMeta;
}

function moveBackendResourcesToCurrentCloudBackend(resources) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyCloudMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath();
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfigCloudFilePath = pathManager.getCurrentBackendConfigFilePath();
  const tagFilePath = pathManager.getTagFilePath();
  const tagCloudFilePath = pathManager.getCurrentTagFilePath();

  for (let i = 0; i < resources.length; i += 1) {
    const sourceDir = path.normalize(path.join(pathManager.getBackendDirPath(), resources[i].category, resources[i].resourceName));
    const targetDir = path.normalize(
      path.join(pathManager.getCurrentCloudBackendDirPath(), resources[i].category, resources[i].resourceName),
    );

    if (fs.pathExistsSync(targetDir)) {
      fs.removeSync(targetDir);
    }

    fs.ensureDirSync(targetDir);

    fs.copySync(sourceDir, targetDir);
  }

  fs.copySync(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
  fs.copySync(backendConfigFilePath, backendConfigCloudFilePath, { overwrite: true });
  // if project hasn't been initialized after tags has been released
  if (fs.existsSync(tagFilePath)) {
    fs.copySync(tagFilePath, tagCloudFilePath, { overwrite: true });
  }
}

export function updateamplifyMetaAfterResourceAdd(category, resourceName, options: { dependsOn? } = {}) {
  const amplifyMeta = stateManager.getMeta();

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

  stateManager.setMeta(undefined, amplifyMeta);

  updateBackendConfigAfterResourceAdd(category, resourceName, options);
}

export function updateProvideramplifyMeta(providerName, options) {
  const amplifyMeta = stateManager.getMeta();

  if (!amplifyMeta.providers) {
    amplifyMeta.providers = {};
    amplifyMeta.providers[providerName] = {};
  } else if (!amplifyMeta.providers[providerName]) {
    amplifyMeta.providers[providerName] = {};
  }

  Object.keys(options).forEach(key => {
    amplifyMeta.providers[providerName][key] = options[key];
  });

  stateManager.setMeta(undefined, amplifyMeta);
}

export function updateamplifyMetaAfterResourceUpdate(category, resourceName, attribute, value) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
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
  const amplifyMeta = stateManager.getMeta();
  const currentTimestamp = new Date();

  for (let i = 0; i < resources.length; i += 1) {
    const sourceDir = path.normalize(path.join(pathManager.getBackendDirPath(), resources[i].category, resources[i].resourceName));
    const hashDir = await getHashForResourceDir(sourceDir);

    /*eslint-disable */
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushTimeStamp = currentTimestamp;
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushDirHash = hashDir;
    /* eslint-enable */
  }

  stateManager.setMeta(undefined, amplifyMeta);

  moveBackendResourcesToCurrentCloudBackend(resources);
}

function getHashForResourceDir(dirPath) {
  const options = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage'] },
  };

  return hashElement(dirPath, options).then(result => result.hash);
}

export function updateamplifyMetaAfterBuild(resource) {
  const amplifyMeta = stateManager.getMeta();
  const currentTimestamp = new Date();

  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastBuildTimeStamp = currentTimestamp;
  /* eslint-enable */

  stateManager.setMeta(undefined, amplifyMeta);
}

export function updateAmplifyMetaAfterPackage(resource, zipFilename) {
  const amplifyMeta = stateManager.getMeta();
  const currentTimestamp = new Date();

  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastPackageTimeStamp = currentTimestamp;
  amplifyMeta[resource.category][resource.resourceName].distZipFilename = zipFilename;
  /* eslint-enable */

  stateManager.setMeta(undefined, amplifyMeta);
}

export function updateamplifyMetaAfterResourceDelete(category, resourceName) {
  const currentMeta = stateManager.getCurrentMeta();

  const resourceDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), category, resourceName));

  if (currentMeta[category] && currentMeta[category][resourceName] !== undefined) {
    delete currentMeta[category][resourceName];
  }

  stateManager.setCurrentMeta(undefined, currentMeta);

  fs.removeSync(resourceDir);
}

function checkForCyclicDependencies(category, resourceName, dependsOn: [{ category; resourceName }]) {
  const amplifyMeta = stateManager.getMeta();
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
