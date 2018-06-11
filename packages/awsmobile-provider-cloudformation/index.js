const fs = require('fs');
const path = require('path');
const S3 = require("./src/aws-utils/aws-s3");
const Cloudformation = require("./src/aws-utils/aws-cfn");
const providerName = require("./constants").ProviderName;
const nestedStackFileName = "nested-cloudformation-stack.yml"; 

function pushResources(context, category) {

    let {resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted} = context.awsmobile.getResourceStatus(category);
    let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    let projectDetails = context.awsmobile.getProjectDetails();

    return updateS3Templates(context, resources, projectDetails.awsmobileMeta)
        .then(() => {
            projectDetails = context.awsmobile.getProjectDetails();
            if(resources.length > 0 || resourcesToBeDeleted.length > 0) {
                return updateCloudFormationNestedStack(context, formNestedStack(projectDetails.awsmobileMeta), resourcesToBeDeleted);
            }
        })
        .then(() => {
            if(resources.length > 0) {
                context.awsmobile.updateAwsMobileMetaAfterPush(resources);
            }
            for(let i = 0; i < resourcesToBeDeleted.length; i++) {
                context.awsmobile.updateAwsMobileMetaAfterResourceDelete(resourcesToBeDeleted[i].category,resourcesToBeDeleted[i].resourceName);
            }
        });
}

function updateCloudFormationNestedStack(context, nestedStack) {
    const {awsmobile} = context;
    let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
    let nestedStackFilepath = path.normalize(path.join(backEndDir, providerName, nestedStackFileName));

    let jsonString = JSON.stringify(nestedStack, null, '\t');
    context.filesystem.write(nestedStackFilepath, jsonString);

    return new Cloudformation(context)
        .then((cfnItem) => {
            if(Object.keys(nestedStack.Resources).length === 0) {
                return cfnItem.deleteResourceStack()
                    .then(() => {
                        let awsmobileMetaFilePath = awsmobile.pathManager.getAwsmobileMetaFilePath();
                        let awsmobileCloudMetaFilePath = awsmobile.pathManager.getCurentBackendCloudAwsmobileMetaFilePath();

                        removeStackNameInAwsMetaFile(awsmobileMetaFilePath);
                        removeStackNameInAwsMetaFile(awsmobileCloudMetaFilePath);

                    });
            } else {
                return cfnItem.updateResourceStack(path.normalize(path.join(backEndDir, providerName)), nestedStackFileName);
            }
        });
}

function removeStackNameInAwsMetaFile(awsmobileMetaFilePath) {
    let awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
    if(awsmobileMeta.provider) {
        if(awsmobileMeta.provider[providerName]) {
            delete awsmobileMeta.provider[providerName].parentStackName;
            let jsonString = JSON.stringify(awsmobileMeta, null, '\t');
            fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
        }
    }
}

function updateS3Templates(context, resourcesToBeUpdated, awsmobileMeta) {
    let promises = [];

    for(let i = 0; i < resourcesToBeUpdated.length; i++) {
        let category = resourcesToBeUpdated[i].category;
        let resourceName = resourcesToBeUpdated[i].resourceName;
        let backEndDir = context.awsmobile.pathManager.getBackendDirPath();
        let resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
        let files = fs.readdirSync(resourceDir);
        // Fetch all the Cloudformation templates for the resource (can be json or yml)
        let cfnFiles = files.filter(function(file) {
            return ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1));
        });

        for (let j = 0; j < cfnFiles.length; j++) {
            promises.push(uploadTemplateToS3(context, resourceDir, cfnFiles[j], category, resourceName, awsmobileMeta));
        }
    }

    return Promise.all(promises);
}

function uploadTemplateToS3(context, resourceDir, cfnFile, category, resourceName, awsmobileMeta) {
    let filePath = path.normalize(path.join(resourceDir, cfnFile));

    return new S3(context)
        .then((s3) => {
            let s3Params = {
                Body: fs.createReadStream(filePath),
                Key: cfnFile
            };
            return s3.uploadFile(s3Params);
        })
        .then((projectBucket) => {
            let templateURL = "https://s3.amazonaws.com/" + projectBucket + '/' + cfnFile;
            let providerMetadata = awsmobileMeta[category][resourceName].providerMetadata || {};
            providerMetadata.s3TemplateURL = templateURL;
            providerMetadata.logicalId = category + resourceName;
            context.awsmobile.updateAwsMobileMetaAfterResourceUpdate(category, resourceName, "providerMetadata", providerMetadata);
        });
}

function formNestedStack(awsmobileMeta) {

    let nestedStack = {
        "AWSTemplateFormatVersion": "2010-09-09",
        "Resources": {}
    };

    let categories = Object.keys(awsmobileMeta);
    categories = categories.filter((category) => category !== "provider");

    categories.forEach((category) => {
        let resources = Object.keys(awsmobileMeta[category]);

        resources.forEach((resource) => {
            let resourceDetails = awsmobileMeta[category][resource];
            let resourceKey = category +  resource;
            let templateURL = resourceDetails.providerMetadata.s3TemplateURL;

            nestedStack.Resources[resourceKey] = {
                "Type": "AWS::CloudFormation::Stack",
                "Properties": {
                    "TemplateURL": templateURL
                }
            };
        });
    });

    return nestedStack;
}


module.exports = {
    pushResources
}