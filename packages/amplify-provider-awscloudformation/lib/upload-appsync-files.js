const fs = require('fs');
const path = require('path');

const TransformPackage = require('graphql-transformer-core');
const S3 = require('../src/aws-utils/aws-s3');

const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const providerName = require('./constants').ProviderName;

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}

async function uploadAppSyncFiles(context, resources, defaultParams = {}) {
  resources = resources.filter(resource => resource.service === 'AppSync');
  const buildTimeStamp = new Date().getTime().toString();
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const resourceBuildDir = path.normalize(path.join(backEndDir, category, resourceName, 'build'));
    const projectBucket = getProjectBucket(context);
    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildTimeStamp}`;

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

    const parametersFilePath = path.join(backEndDir, category, resourceName, 'parameters.json');
    let currentParameters;

    if (fs.existsSync(parametersFilePath)) {
      try {
        currentParameters = JSON.parse(fs.readFileSync(parametersFilePath));
      } catch (e) {
        currentParameters = defaultParams;
      }
    }

    Object.assign(currentParameters, {
      S3DeploymentBucket: projectBucket,
      S3DeploymentRootKey: deploymentRootKey,
    });
    Object.assign(currentParameters, defaultParams);
    const jsonString = JSON.stringify(currentParameters, null, 4);
    const parametersOutputFilePath = path.join(backEndDir, category, resourceName, 'build', 'parameters.json');
    fs.writeFileSync(parametersOutputFilePath, jsonString, 'utf8');
  }
}

module.exports = {
  uploadAppSyncFiles,
};
