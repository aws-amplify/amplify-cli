const fs = require('fs-extra');
const { filesystem } = require('gluegun/filesystem');
const path = require('path');
const { hashElement } = require('folder-hash');
const pathManager = require('./path-manager');
const {
  updateBackendConfigAfterResourceAdd,
  updateBackendConfigDependsOn,
} = require('./update-backend-config');
const { readJsonFile } = require('./read-json-file');

function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timeStamp) {
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
}

function moveBackendResourcesToCurrentCloudBackend(resources) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyCloudMetaFilePath = pathManager.getCurentAmplifyMetaFilePath();
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfigCloudFilePath = pathManager.getCurrentBackendConfigFilePath();

  for (let i = 0; i < resources.length; i += 1) {
    const sourceDir = path.normalize(path.join(
      pathManager.getBackendDirPath(),
      resources[i].category,
      resources[i].resourceName,
    ));

    const targetDir = path.normalize(path.join(
      pathManager.getCurrentCloudBackendDirPath(),
      resources[i].category,
      resources[i].resourceName,
    ));

    if (fs.pathExistsSync(targetDir)) {
      filesystem.remove(targetDir);
    }

    fs.ensureDirSync(targetDir);

    fs.copySync(sourceDir, targetDir);
  }

  fs.copySync(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
  fs.copySync(backendConfigFilePath, backendConfigCloudFilePath, { overwrite: true });
}

function updateamplifyMetaAfterResourceAdd(category, resourceName, options = {}) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
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

function updateProvideramplifyMeta(providerName, options) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();

  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  if (!amplifyMeta.providers) {
    amplifyMeta.providers = {};
    amplifyMeta.providers[providerName] = {};
  } else if (!amplifyMeta.providers[providerName]) {
    amplifyMeta.providers[providerName] = {};
  }

  Object.keys(options).forEach((key) => {
    amplifyMeta.providers[providerName][key] = options[key];
  });

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}


function updateamplifyMetaAfterResourceUpdate(category, resourceName, attribute, value) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  // let amplifyCloudMetaFilePath = pathManager.getCurentAmplifyMetaFilePath();
  const currentTimestamp = new Date();
  if (attribute === 'dependsOn') {
    checkForCyclicDependencies(category, resourceName, value);
  }
  updateAwsMetaFile(
    amplifyMetaFilePath,
    category,
    resourceName,
    attribute,
    value,
    currentTimestamp,
  );
  if (['dependsOn', 'service'].includes(attribute)) {
    updateBackendConfigDependsOn(category, resourceName, attribute, value);
  }
}

async function updateamplifyMetaAfterPush(resources) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);

  const currentTimestamp = new Date();
  let sourceDir;

  for (let i = 0; i < resources.length; i += 1) {
    sourceDir = path.normalize(path.join(
      pathManager.getBackendDirPath(),
      resources[i].category,
      resources[i].resourceName,
    ));
    const hashDir = await getHashForResourceDir(sourceDir);

    /*eslint-disable */
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushTimeStamp = currentTimestamp;
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushDirHash = hashDir;
    /* eslint-enable */
  }


  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');

  moveBackendResourcesToCurrentCloudBackend(resources);
}

function getHashForResourceDir(dirPath) {
  const options = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage'] },
  };

  return hashElement(dirPath, options)
    .then(result => result.hash);
}

function updateamplifyMetaAfterBuild(resource) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  const currentTimestamp = new Date();
  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastBuildTimeStamp = currentTimestamp;
  /* eslint-enable */

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

function updateAmplifyMetaAfterPackage(resource, zipFilename) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  const currentTimestamp = new Date();
  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastPackageTimeStamp = currentTimestamp;
  amplifyMeta[resource.category][resource.resourceName].distZipFilename = zipFilename;
  /* eslint-enable */

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}


function updateamplifyMetaAfterResourceDelete(category, resourceName) {
  const amplifyMetaFilePath = pathManager.getCurentAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);

  const resourceDir = path.normalize(path.join(
    pathManager.getCurrentCloudBackendDirPath(),
    category,
    resourceName,
  ));

  if (amplifyMeta[category] && amplifyMeta[category][resourceName] !== undefined) {
    delete amplifyMeta[category][resourceName];
  }

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  filesystem.remove(resourceDir);
}

function checkForCyclicDependencies(category, resourceName, dependsOn) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = readJsonFile(amplifyMetaFilePath);
  let cyclicDependency = false;

  if (dependsOn) {
    dependsOn.forEach((resource) => {
      if (resource.category === category && resource.resourceName === resourceName) {
        cyclicDependency = true;
      }
      if (amplifyMeta[resource.category] &&
          amplifyMeta[resource.category][resource.resourceName]) {
        const dependsOnResourceDependency =
          amplifyMeta[resource.category][resource.resourceName].dependsOn;
        if (dependsOnResourceDependency) {
          dependsOnResourceDependency.forEach((dependsOnResource) => {
            if (dependsOnResource.category === category &&
              dependsOnResource.resourceName === resourceName) {
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


module.exports = {
  updateamplifyMetaAfterResourceAdd,
  updateamplifyMetaAfterResourceUpdate,
  updateamplifyMetaAfterResourceDelete,
  updateamplifyMetaAfterPush,
  updateamplifyMetaAfterBuild,
  updateProvideramplifyMeta,
  updateAmplifyMetaAfterPackage,
};
