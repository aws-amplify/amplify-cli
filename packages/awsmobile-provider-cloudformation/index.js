const fs = require('fs');
const path = require('path');

var CloudFormation = require("./src/aws-utils/aws-cfn");

function createResource(context, category, resourceName) {
    let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
    let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    let files = fs.readdirSync(resourceDir);

    // Fetch all the Cloudformation templates for the resource (can be json or yml)
    let cfnFiles = files.filter(function(file) {
        return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
    });

    return new CloudFormation(context)
        .then((cfnItem) => {
            return cfnItem.updateResourceStacks(resourceDir, cfnFiles, category, resourceName);
        });
}

function updateResource(context, category, resourceName) {
    let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
    let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    let files = fs.readdirSync(resourceDir);

    // Fetch all the Cloudformation templates (can be json or yml)
    let cfnFiles = files.filter(function(file) {
        return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
    });

    return new CloudFormation(context)
        .then((cfnItem) => {
            return cfnItem.updateResourceStacks(resourceDir, cfnFiles, category, resourceName);
        });
}

function deleteResource(context, category, resourceName) {
    let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
    let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));

    return new CloudFormation(context)
        .then((cfnItem) => {
            return cfnItem.deleteResourceStack(resourceDir, category, resourceName);
        });
}

module.exports = {
    createResource,
    updateResource,
    deleteResource
}