const fs = require('fs-extra');
const { filesystem } = require('gluegun/filesystem');
const path = require('path');
const pathManager = require('./path-manager');

function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timeStamp) {
  const amplifyMeta = JSON.parse(fs.readFileSync(filePath));

  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
    amplifyMeta[category][resourceName] = {};
  } else if (!amplifyMeta[category][resourceName]) {
    amplifyMeta[category][resourceName] = {};
  }

  amplifyMeta[category][resourceName][attribute] = value;
  amplifyMeta[category][resourceName].lastPushTimeStamp = timeStamp;

  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

function moveBackendResourcesToCurrentCloudBackend(resources) {
  const targetDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath()));
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyCloudMetaFilePath = pathManager.getCurentBackendCloudamplifyMetaFilePath();

  for (let i = 0; i < resources.length; i += 1) {
    const sourceDir = path.normalize(
      pathManager.getBackendDirPath(),
      resources[i].category,
      resources[i].resourceName,
    );
    fs.copySync(sourceDir, targetDir);
  }
  fs.copySync(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
}

function updateamplifyMetaAfterResourceAdd(category, resourceName, options) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
    amplifyMeta[category][resourceName] = {};
  } else if (!amplifyMeta[category][resourceName]) {
    amplifyMeta[category][resourceName] = {};
  }

  amplifyMeta[category][resourceName] = options;
  const jsonString = JSON.stringify(amplifyMeta, null, '\t');
  fs.writeFileSync(amplifyMetaFilePath, jsonString, 'utf8');
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
  // let amplifyCloudMetaFilePath = pathManager.getCurentBackendCloudamplifyMetaFilePath();
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

function updateamplifyMetaAfterPush(resources) {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyMeta = JSON.parse(fs.readFileSync(amplifyMetaFilePath));
  const currentTimestamp = new Date();

  for (let i = 0; i < resources.length; i += 1) {
    /*eslint-disable */
    amplifyMeta[resources[i].category][resources[i].resourceName].lastPushTimeStamp = currentTimestamp;
    /* eslint-enable */
  }

  moveBackendResourcesToCurrentCloudBackend(resources);
}

function updateamplifyMetaAfterResourceDelete(category, resourceName) {
  const amplifyMetaFilePath = pathManager.getCurentBackendCloudamplifyMetaFilePath();
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
  updateProvideramplifyMeta,
};
