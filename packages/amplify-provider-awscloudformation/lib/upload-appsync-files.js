const fs = require('fs');
const fsext = require('fs-extra');
const path = require('path');
const TransformPackage = require('graphql-transformer-core');
const { S3 } = require('./aws-utils/aws-s3');
const { fileLogger } = require('./utils/aws-logger');
const { minifyAllJSONInFolderRecursively } = require('./utils/minify-json');
const logger = fileLogger('upload-appsync-files');
const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const providerName = require('./constants').ProviderName;
const { hashElement } = require('folder-hash');
const ora = require('ora');
const PARAM_FILE_NAME = 'parameters.json';
const CF_FILE_NAME = 'cloudformation-template.json';
function getProjectBucket(context) {
    const projectDetails = context.amplify.getProjectDetails();
    const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
    return projectBucket;
}
async function uploadAppSyncFiles(context, resourcesToUpdate, allResources, options = {}) {
    var _a;
    const allApiResourceToUpdate = resourcesToUpdate.filter((resource) => resource.service === 'AppSync');
    const allApiResources = allResources.filter((resource) => resource.service === 'AppSync');
    const { defaultParams, useDeprecatedParameters } = options;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const projectBucket = getProjectBucket(context);
    const getDeploymentRootKey = async (resourceDir) => {
        let deploymentSubKey;
        if (useDeprecatedParameters) {
            deploymentSubKey = new Date().getTime();
        }
        else {
            deploymentSubKey = await hashDirectory(resourceDir);
        }
        const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
        return deploymentRootKey;
    };
    const getApiKeyConfigured = () => {
        const projectDetails = context.amplify.getProjectDetails();
        const appSyncAPIs = Object.keys(projectDetails.amplifyMeta.api).reduce((acc, apiName) => {
            const api = projectDetails.amplifyMeta.api[apiName];
            if (api.service === 'AppSync') {
                acc.push({ ...api, name: apiName });
            }
            return acc;
        }, []);
        const appSyncApi = appSyncAPIs && appSyncAPIs.length && appSyncAPIs.length > 0 ? appSyncAPIs[0] : undefined;
        let hasApiKey = false;
        if (appSyncApi) {
            const { authConfig, securityType } = appSyncApi.output;
            if (securityType && securityType === 'API_KEY') {
                hasApiKey = true;
            }
            else if (authConfig) {
                if (authConfig.defaultAuthentication.authenticationType === 'API_KEY') {
                    hasApiKey = true;
                }
                else if (authConfig.additionalAuthenticationProviders &&
                    authConfig.additionalAuthenticationProviders.find((p) => p.authenticationType === 'API_KEY')) {
                    hasApiKey = true;
                }
            }
        }
        return hasApiKey;
    };
    const writeUpdatedParametersJson = (resource, rootKey) => {
        const { category, resourceName } = resource;
        const parametersFilePath = path.join(backEndDir, category, resourceName, PARAM_FILE_NAME);
        const currentParameters = defaultParams || {};
        const apiKeyConfigured = getApiKeyConfigured();
        currentParameters.CreateAPIKey = apiKeyConfigured ? 1 : 0;
        if (fs.existsSync(parametersFilePath)) {
            try {
                const paramFile = fs.readFileSync(parametersFilePath).toString();
                const personalParams = JSON.parse(paramFile);
                Object.assign(currentParameters, personalParams);
                if (!currentParameters.authRoleName) {
                    currentParameters.authRoleName = {
                        Ref: 'AuthRoleName',
                    };
                }
                if (!currentParameters.unauthRoleName) {
                    currentParameters.unauthRoleName = {
                        Ref: 'UnauthRoleName',
                    };
                }
                if (personalParams.CreateAPIKey !== undefined && personalParams.APIKeyExpirationEpoch !== undefined) {
                    context.print.warning('APIKeyExpirationEpoch and CreateAPIKey parameters should not used together because it can cause ' +
                        'unwanted behavior. In the future APIKeyExpirationEpoch will be removed, use CreateAPIKey instead.');
                }
                if (personalParams.APIKeyExpirationEpoch) {
                    if (personalParams.APIKeyExpirationEpoch === -1) {
                        currentParameters.CreateAPIKey = 0;
                        delete currentParameters.APIKeyExpirationEpoch;
                        context.print.warning("APIKeyExpirationEpoch parameter's -1 value is deprecated to disable " +
                            'the API Key creation. In the future CreateAPIKey parameter replaces this behavior.');
                    }
                    else {
                        currentParameters.CreateAPIKey = 1;
                    }
                }
                if (personalParams.CreateAPIKey === undefined) {
                    currentParameters.CreateAPIKey = apiKeyConfigured ? 1 : 0;
                }
            }
            catch (e) {
                context.print.error(`Could not parse parameters file at "${parametersFilePath}"`);
            }
        }
        if (!useDeprecatedParameters) {
            Object.assign(currentParameters, {
                S3DeploymentBucket: projectBucket,
                S3DeploymentRootKey: rootKey,
            });
        }
        const cfFilePath = path.join(backEndDir, category, resourceName, 'build', CF_FILE_NAME);
        try {
            const cfFileContents = fs.readFileSync(cfFilePath).toString();
            const cfTemplateJson = JSON.parse(cfFileContents);
            const paramKeys = Object.keys(currentParameters);
            for (let keyIndex = 0; keyIndex < paramKeys.length; keyIndex++) {
                const paramKey = paramKeys[keyIndex];
                if (!cfTemplateJson.Parameters[paramKey]) {
                    delete currentParameters[paramKey];
                }
            }
        }
        catch (e) {
            context.print.warning(`Could not read cloudformation template at path: ${cfFilePath}`);
        }
        const jsonString = JSON.stringify(currentParameters, null, 4);
        const buildDirectoryPath = path.join(backEndDir, category, resourceName, 'build');
        const parametersOutputFilePath = path.join(buildDirectoryPath, PARAM_FILE_NAME);
        fsext.ensureDirSync(buildDirectoryPath);
        fs.writeFileSync(parametersOutputFilePath, jsonString, 'utf8');
    };
    if (allApiResourceToUpdate.length > 0) {
        const resource = allApiResourceToUpdate[0];
        const { category, resourceName } = resource;
        const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
        const resourceBuildDir = path.normalize(path.join(resourceDir, 'build'));
        const deploymentRootKey = await getDeploymentRootKey(resourceDir);
        writeUpdatedParametersJson(resource, deploymentRootKey);
        const s3Client = await S3.getInstance(context);
        if (!fs.existsSync(resourceBuildDir)) {
            return;
        }
        if ((_a = context.input.options) === null || _a === void 0 ? void 0 : _a.minify) {
            minifyAllJSONInFolderRecursively(resourceBuildDir);
        }
        const spinner = new ora('Uploading files.');
        spinner.start();
        await TransformPackage.uploadAPIProject({
            directory: resourceBuildDir,
            upload: async (blob) => {
                const { Key, Body } = blob;
                const fullKey = `${deploymentRootKey}/${Key}`;
                logger('uploadAppSyncFiles.upload.s3Client.uploadFile', [{ Key }])();
                return await s3Client.uploadFile({
                    Key: fullKey,
                    Body,
                }, false);
            },
        });
        spinner.stop();
    }
    else if (allApiResources.length > 0) {
        const resource = allApiResources[0];
        const { category, resourceName } = resource;
        const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
        const deploymentRootKey = await getDeploymentRootKey(resourceDir);
        writeUpdatedParametersJson(resource, deploymentRootKey);
    }
}
async function hashDirectory(directory) {
    const options = {
        encoding: 'hex',
        folders: {
            exclude: ['build'],
        },
    };
    const hashResult = await hashElement(directory, options);
    return hashResult.hash;
}
module.exports = {
    ROOT_APPSYNC_S3_KEY,
    uploadAppSyncFiles,
    hashDirectory,
};
//# sourceMappingURL=upload-appsync-files.js.map