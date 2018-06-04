const fs = require('fs-extra');
const { filesystem } = require('gluegun/filesystem')
const path = require('path');
const pathManager = require('./path-manager');

function updateAwsMobileMetaAfterResourceAdd(category, resourceName, options) {
    const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
    if (!awsmobileMeta[category]) {
        awsmobileMeta[category] = {};
        awsmobileMeta[category][resourceName] = {};
    } else {
        if (!awsmobileMeta[category][resourceName]) {
            awsmobileMeta[category][resourceName] = {};
        }
    }

    awsmobileMeta[category][resourceName] = options;
    let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
    fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
}

function updateAwsMobileMetaAfterResourceUpdate(category, resourceName, options) {
    let awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    let awsmobileCloudMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
    let currentTimestamp = new Date();

    updateAwsMetaFile(awsmobileMetaFilePath, category, resourceName, options, currentTimestamp);
    updateAwsMetaFile(awsmobileCloudMetaFilePath, category, resourceName, options, currentTimestamp);

    // Move resource directories from backend to current-backend
    moveBackendResourcesToCurrentCloudBackend(category, resourceName);

}

function updateAwsMobileMetaAfterResourceDelete(category, resourceName) {
    let awsmobileMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
    let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));

    let resourceDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), category, resourceName));

    if (awsmobileMeta[category][resourceName] !== undefined) {
        delete awsmobileMeta[category][resourceName];
    }

    let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
    fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
    filesystem.remove(resourceDir);
}

function updateAwsMetaFile(filePath, category, resourceName, options, timeStamp) {
    let awsmobileMeta = JSON.parse(fs.readFileSync(filePath));

    if (!awsmobileMeta[category]) {
        awsmobileMeta[category] = {};
        awsmobileMeta[category][resourceName] = {};
    } else {
        if (!awsmobileMeta[category][resourceName]) {
            awsmobileMeta[category][resourceName] = {};
        }
    }

    awsmobileMeta[category][resourceName].options = options;
    awsmobileMeta[category][resourceName].lastPushTimeStamp = timeStamp;

    let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
    fs.writeFileSync(filePath, jsonString, 'utf8');
}

function moveBackendResourcesToCurrentCloudBackend(category, resourceName) {
    let targetDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), category, resourceName));
    let sourceDir = path.normalize(pathManager.getBackendDirPath(), category, resourceName);

    let awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    let awsmobileCloudMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();

    try {
        fs.copySync(sourceDir, targetDir);
        fs.copySync(awsmobileMetaFilePath, awsmobileCloudMetaFilePath);
    } catch(err) {
        console.log(err.stack);
    }
}

module.exports = {
    updateAwsMobileMetaAfterResourceAdd,
    updateAwsMobileMetaAfterResourceUpdate,
    updateAwsMobileMetaAfterResourceDelete
}