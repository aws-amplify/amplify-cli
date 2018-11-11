const fs = require('fs-extra');
const { filesystem } = require('gluegun/filesystem');
const path = require('path');
const { hashElement } = require('folder-hash');
const pathManager = require('./path-manager');
const {
  updateBackendConfigAfterResourceAdd,
} = require('./update-backend-config');

function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timeStamp) {
  const amplifyMeta = JSON.parse(fs.readFileSync(filePath));

  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
    amplifyMeta[category][resourceName] = {};
  } else if (!amplifyMeta[category][resourceName]) {
    amplifyMeta[category][resourceName] = {};
  }
  if (!amplifyMeta[category][resourceName][attribute]) {
    amplifyMeta[category][resourceName][attribute] = {};
  }
  if (Array.isArray(amplifyMeta[category][resourceName][attribute])) {
    amplifyMeta[category][resourceName][attribute] = value;
  } else {
    Object.assign(amplifyMeta[category][resourceName][attribute], value);
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

    // If the directory structure does not exist, it is created
    fs.ensureDirSync(targetDir);

    fs.copySync(sourceDir, targetDir);
  }

  fs.copySync(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
  fs.copySync(backendConfigFilePath, backendConfigCloudFilePath, { overwrite: true });
}

function updateamplifyMetaAfterResourceAdd(category, resourceName, options) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
  }
  if (!amplifyMeta[category][resourceName]) {
    amplifyMeta[category][resourceName] = {};
    amplifyMeta[category][resourceName] = options;
    const jsonString = JSON.stringify(amplifyMeta, null, '\t');
    fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  }

  updateBackendConfigAfterResourceAdd(category, resourceName, options);
}

function updateProvideramplifyMeta(providerName, options) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();

  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
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

  updateAwsMetaFile(
    amplifyMetaFilePath,
    category,
    resourceName,
    attribute,
    value,
    currentTimestamp,
  );
}

async function updateamplifyMetaAfterPush(resources) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

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
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  const currentTimestamp = new Date();
  /*eslint-disable */
  amplifyMeta[resource.category][resource.resourceName].lastBuildTimeStamp = currentTimestamp;
  /* eslint-enable */

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
}

function updateAmplifyMetaAfterPackage(resource, zipFilename) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
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
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));

  const resourceDir = path.normalize(path.join(
    pathManager.getCurrentCloudBackendDirPath(),
    category,
    resourceName,
  ));

  if (amplifyMeta[category][resourceName] !== undefined) {
    delete amplifyMeta[category][resourceName];
  }

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
  filesystem.remove(resourceDir);
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
