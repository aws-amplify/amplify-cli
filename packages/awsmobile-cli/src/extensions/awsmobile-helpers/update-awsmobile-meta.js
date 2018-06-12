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

function updateProviderAwsMobileMeta(providerName, options) {
    const awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();

    let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
    if (!awsmobileMeta.provider) {
        awsmobileMeta.provider = {};
        awsmobileMeta.provider[providerName] = {};
    } else {
        if (!awsmobileMeta.provider[providerName]) {
            awsmobileMeta.provider[providerName] = {};
        }
    }

    Object.keys(options).forEach((key) => {
        awsmobileMeta.provider[providerName][key] = options[key];
    });

    let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
    fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
}


function updateAwsMobileMetaAfterResourceUpdate(category, resourceName, attribute, value) {
    let awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    //let awsmobileCloudMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
    let currentTimestamp = new Date();

    updateAwsMetaFile(awsmobileMetaFilePath, category, resourceName, attribute, value, currentTimestamp);
    //updateAwsMetaFile(awsmobileCloudMetaFilePath, category, resourceName, attribute, value, currentTimestamp);

    // Move resource directories from backend to current-backend
    //moveBackendResourcesToCurrentCloudBackend(category, resourceName);

}

function updateAwsMobileMetaAfterPush(resources) {
    let awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
    let currentTimestamp = new Date();

    for(let i = 0; i < resources.length; i++) {
        awsmobileMeta[resources[i].category][resources[i].resourceName].lastPushTimeStamp = currentTimestamp;
    }
    console.log('Im here!!');

    moveBackendResourcesToCurrentCloudBackend(resources);

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

function updateAwsMetaFile(filePath, category, resourceName, attribute, value, timeStamp) {
    let awsmobileMeta = JSON.parse(fs.readFileSync(filePath));

    if (!awsmobileMeta[category]) {
        awsmobileMeta[category] = {};
        awsmobileMeta[category][resourceName] = {};
    } else {
        if (!awsmobileMeta[category][resourceName]) {
            awsmobileMeta[category][resourceName] = {};
        }
    }

    awsmobileMeta[category][resourceName][attribute] = value;
    awsmobileMeta[category][resourceName].lastPushTimeStamp = timeStamp;

    let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
    fs.writeFileSync(filePath, jsonString, 'utf8');
}

function moveBackendResourcesToCurrentCloudBackend(resources) {
    let targetDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath()));
    let awsmobileMetaFilePath = pathManager.getAwsmobileMetaFilePath();
    let awsmobileCloudMetaFilePath = pathManager.getCurentBackendCloudAwsmobileMetaFilePath();

    for(let i = 0; i < resources.length; i++) {
        let sourceDir = path.normalize(pathManager.getBackendDirPath(), resources[i].category, resources[i].resourceName);
        fs.copySync(sourceDir, targetDir);
    }
    console.log('okay im here');
    console.log(awsmobileMetaFilePath);
    fs.copySync(awsmobileMetaFilePath, awsmobileCloudMetaFilePath, { overwrite: true });
}

module.exports = {
    updateAwsMobileMetaAfterResourceAdd,
    updateAwsMobileMetaAfterResourceUpdate,
    updateAwsMobileMetaAfterResourceDelete,
    updateAwsMobileMetaAfterPush,
    updateProviderAwsMobileMeta
}