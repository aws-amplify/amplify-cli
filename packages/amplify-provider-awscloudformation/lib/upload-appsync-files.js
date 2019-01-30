const fs = require('fs');
const path = require('path');

const TransformPackage = require('graphql-transformer-core');
const S3 = require('../src/aws-utils/aws-s3');

const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const providerName = require('./constants').ProviderName;
const { hashElement } = require('folder-hash');

const PARAM_FILE_NAME = 'parameters.json';

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}

/**
 * Updates build/parameters.json with new timestamps and then uploads the
 * contents of the build/ directory to S3.
 * @param {*} context
 * @param {*} resources
 * @param {*} defaultParams
 */
async function uploadAppSyncFiles(context, resources, options = {}) {
  resources = resources.filter(resource => resource.service === 'AppSync');
  const { defaultParams, useDeprecatedParameters } = options;
  // new Date().getTime().toString();
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const resourceBuildDir = path.normalize(path.join(backEndDir, category, resourceName, 'build'));
    const projectBucket = getProjectBucket(context);
    const buildDirectoryHash = await hashDirectory(resourceBuildDir);
    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildDirectoryHash}`;

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
        S3DeploymentRootKey: deploymentRootKey,
      });
    }
    const jsonString = JSON.stringify(currentParameters, null, 4);
    const parametersOutputFilePath = path.join(backEndDir, category, resourceName, 'build', PARAM_FILE_NAME);
    fs.writeFileSync(parametersOutputFilePath, jsonString, 'utf8');

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
  }
}

// Hash a directory into a unique value.
async function hashDirectory(directory) {
  const options = {
    folders: { exclude: ['.*', 'node_modules', 'test_coverage'] },
  };

  return hashElement(directory, options).then(result => result.hash);
}

module.exports = {
  uploadAppSyncFiles,
};
