const fs = require('fs-extra');
const { filesystem } = require('gluegun/filesystem');
const path = require('path');
const pathManager = require('./path-manager');

function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timeStamp) {
  const awsmobileMeta = JSON.parse(fs.readFileSync(filePath));

  if (!awsmobileMeta[category]) {
    awsmobileMeta[category] = {};
    awsmobileMeta[category][resourceName] = {};
  } else if (!awsmobileMeta[category][resourceName]) {
    awsmobileMeta[category][resourceName] = {};
  }

  awsmobileMeta[category][resourceName][attribute] = value;
  awsmobileMeta[category][resourceName].lastPushTimeStamp = timeStamp;

  const jsonString = JSON.stringify(awsmobileMeta, null, '\t');
  fs.writeFileSync(filePath, jsonString, 'utf8');
}

function moveBackendResourcesToCurrentCloudBackend(resources) {
  const targetDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath()));
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileCloudMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();

  for (let i = 0; i < resources.length; i += 1) {
    const sourceDir = path.normalize(
      pathManager.getBackendDirPath(),
      resources[i].category,
      resources[i].resourceName,
    );
    fs.copySync(sourceDir, targetDir);
  }
  fs.copySync(awsmobileMetaFilePath, awsmobileCloudMetaFilePath, { overwrite: true });
}

function updateAwsMobileMetaAfterResourceAdd(category, resourceName, options) {
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
  if (!awsmobileMeta[category]) {
    awsmobileMeta[category] = {};
    awsmobileMeta[category][resourceName] = {};
  } else if (!awsmobileMeta[category][resourceName]) {
    awsmobileMeta[category][resourceName] = {};
  }

  awsmobileMeta[category][resourceName] = options;
  const jsonString = JSON.stringify(awsmobileMeta, null, '\t');
  fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
}

function updateProviderAwsMobileMeta(providerName, options) {
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();

  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
  if (!awsmobileMeta.providers) {
    awsmobileMeta.providers = {};
    awsmobileMeta.providers[providerName] = {};
  } else if (!awsmobileMeta.providers[providerName]) {
    awsmobileMeta.providers[providerName] = {};
  }

  Object.keys(options).forEach((key) => {
    awsmobileMeta.providers[providerName][key] = options[key];
  });

  const jsonString = JSON.stringify(awsmobileMeta, null, '\t');
  fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
}


function updateAwsMobileMetaAfterResourceUpdate(category, resourceName, attribute, value) {
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  // let awsmobileCloudMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
  const currentTimestamp = new Date();

  updateAwsMetaFile(
    awsmobileMetaFilePath,
    category,
    resourceName,
    attribute,
    value,
    currentTimestamp,
  );
}

function updateAwsMobileMetaAfterPush(resources) {
  const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
  const currentTimestamp = new Date();

  for (let i = 0; i < resources.length; i += 1) {
    /*eslint-disable */
    awsmobileMeta[resources[i].category][resources[i].resourceName].lastPushTimeStamp = currentTimestamp;
    /* eslint-enable */
  }

  moveBackendResourcesToCurrentCloudBackend(resources);
}

function updateAwsMobileMetaAfterResourceDelete(category, resourceName) {
  const awsmobileMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

  const resourceDir = path.normalize(path.join(
    pathManager.getCurrentCloudBackendDirPath(),
    category,
    resourceName,
  ));

  if (awsmobileMeta[category][resourceName] !== undefined) {
    delete awsmobileMeta[category][resourceName];
  }

  const jsonString = JSON.stringify(awsmobileMeta, null, '\t');
  fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
  filesystem.remove(resourceDir);
}


module.exports = {
  updateAwsMobileMetaAfterResourceAdd,
  updateAwsMobileMetaAfterResourceUpdate,
  updateAwsMobileMetaAfterResourceDelete,
  updateAwsMobileMetaAfterPush,
  updateProviderAwsMobileMeta,
};
