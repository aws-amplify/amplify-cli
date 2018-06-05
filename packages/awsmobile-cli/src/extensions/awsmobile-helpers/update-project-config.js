const fs = require('fs-extra');
const { filesystem } = require('gluegun/filesystem')
const path = require('path');
const pathManager = require('./path-manager');

function updateProjectConfig(options) {
    let projectConfigFilePath = pathManager.getProjectConfigFilePath();
    let projectConfig = JSON.parse(fs.readFileSync(projectConfigFilePath));

    Object.keys(options).forEach((key) => {
        projectConfig[key] = options[key];
    });

    let jsonString = JSON.stringify(projectConfig, null, '\t');
    fs.writeFileSync(projectConfigFilePath, jsonString, 'utf8');
}

module.exports = {
    updateProjectConfig
}