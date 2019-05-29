const fs = require('fs');
const fsext = require('fs-extra');
const path = require('path');

const TransformPackage = require('graphql-transformer-core');
const S3 = require('../src/aws-utils/aws-s3');

const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const providerName = require('./constants').ProviderName;
const { hashElement } = require('folder-hash');

const PARAM_FILE_NAME = 'parameters.json';
const CF_FILE_NAME = 'cloudformation-template.json';

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}
/**
 * Updates build/parameters.json with new timestamps and then uploads the
 * contents of the build/ directory to S3.
 * @param {*} context
 * @param {*} resourcesToUpdate
 * @param {*} allResources
 * @param {*} options
 */
async function uploadAppSyncFiles(context, resourcesToUpdate, allResources, options = {}) {
  const allApiResourceToUpdate = resourcesToUpdate.filter(resource => resource.service === 'AppSync');
  const allApiResources = allResources.filter(resource => resource.service === 'AppSync');
  const { defaultParams, useDeprecatedParameters } = options;
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const projectBucket = getProjectBucket(context);

  const getDeploymentRootKey = async (resourceDir) => {
    let deploymentSubKey;
    if (useDeprecatedParameters) {
      deploymentSubKey = new Date().getTime();
    } else {
      deploymentSubKey = await hashDirectory(resourceDir);
    }
    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
    return deploymentRootKey;
  };

  const writeUpdatedParametersJson = (resource, rootKey) => {
    const { category, resourceName } = resource;
    // Read parameters.json, add timestamps, and write to build/parameters.json
    const parametersFilePath = path.join(backEndDir, category, resourceName, PARAM_FILE_NAME);
    const currentParameters = defaultParams || {};
    if (fs.existsSync(parametersFilePath)) {
      try {
        const paramFile = fs.readFileSync(parametersFilePath).toString();
        const personalParams = JSON.parse(paramFile);
        Object.assign(currentParameters, personalParams);
      } catch (e) {
        context.print.error(`Could not parse parameters file at "${parametersFilePath}"`);
      }
    }
    if (!useDeprecatedParameters) {
      Object.assign(currentParameters, {
        S3DeploymentBucket: projectBucket,
        S3DeploymentRootKey: rootKey,
      });
    }

    // As a safety mechanism when dealing with migrations and diff versions,
    // make sure only expected parameters are passed.
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
    } catch (e) {
      context.print.warning(`Could not read cloudformation template at path: ${cfFilePath}`);
    }

    const jsonString = JSON.stringify(currentParameters, null, 4);
    const buildDirectoryPath = path.join(backEndDir, category, resourceName, 'build');
    const parametersOutputFilePath = path.join(buildDirectoryPath, PARAM_FILE_NAME);
    fsext.ensureDirSync(buildDirectoryPath);
    fs.writeFileSync(parametersOutputFilePath, jsonString, 'utf8');
  };

  // There can only be one appsync resource
  if (allApiResourceToUpdate.length > 0) {
    const resource = allApiResourceToUpdate[0];
    const { category, resourceName } = resource;
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const resourceBuildDir = path.normalize(path.join(resourceDir, 'build'));

    const deploymentRootKey = await getDeploymentRootKey(resourceDir);
    writeUpdatedParametersJson(resource, deploymentRootKey);

    // Upload build/* to S3.
    const s3Client = await new S3(context);
    if (!fs.existsSync(resourceBuildDir)) {
      return;
    }
    await TransformPackage.uploadAPIProject({
      directory: resourceBuildDir,
      upload: async (blob) => {
        const { Key, Body } = blob;
        const fullKey = `${deploymentRootKey}/${Key}`;

        return await s3Client.uploadFile({
          Key: fullKey,
          Body,
        });
      },
    });
  } else if (allApiResources.length > 0) {
    // We need to update the parameters file even when we are not deploying the API
    // category to fix a bug around deployments on CI/CD platforms. Basically if a
    // build has not run on this machine before and we are updating a non-api category,
    // the params will not have the S3DeploymentRootKey parameter and will fail.
    // This block uses the consistent hash to fill params so the push
    // succeeds when the api category has not been built on this machine.
    const resource = allApiResources[0];
    const { category, resourceName } = resource;
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const deploymentRootKey = await getDeploymentRootKey(resourceDir);
    writeUpdatedParametersJson(resource, deploymentRootKey);
  }
}

/**
 * Hashes the project directory into a single value. The same project configuration
 * should return the same hash.
 */
async function hashDirectory(directory) {
  const options = {
    encoding: 'hex',
    folders: {
      exclude: ['build'],
    },
  };

  return hashElement(directory, options).then(result => (result.hash));
}

module.exports = {
  uploadAppSyncFiles,
};
