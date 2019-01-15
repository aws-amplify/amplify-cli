const fs = require('fs');
const path = require('path');

<<<<<<< HEAD
const pythonStreamingFunctionFileName = 'python_streaming_function.zip';
const schemaFileName = 'schema.graphql';
=======
>>>>>>> 9378224b7137c1d316f9baa07f650abe84c5a79d
const TransformPackage = require('graphql-transformer-core');
const S3 = require('../src/aws-utils/aws-s3');

const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const providerName = require('./constants').ProviderName;

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}

async function uploadAppSyncFiles(context, resources) {
  resources = resources.filter(resource => resource.service === 'AppSync');
  const buildTimeStamp = new Date().getTime().toString();
  // There can only be one appsync resource
  if (resources.length > 0) {
    const resource = resources[0];
    const { category, resourceName } = resource;
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const resourceBuildDir = path.normalize(path.join(backEndDir, category, resourceName, 'build'));
<<<<<<< HEAD
    const resolverDir = path.normalize(path.join(resourceBuildDir, 'resolvers'));
    const functionsDir = path.normalize(path.join(resourceBuildDir, 'functions'));
    const schemaFilePath = path.normalize(path.join(resourceBuildDir, schemaFileName));
    const projectBucket = getProjectBucket(context)
    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildTimeStamp}`

    const s3Client = await new S3(context)
=======
    const projectBucket = getProjectBucket(context);
    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildTimeStamp}`;

    const s3Client = await new S3(context);
>>>>>>> 9378224b7137c1d316f9baa07f650abe84c5a79d

    if (!fs.existsSync(resourceBuildDir)) {
      return;
    }
    await TransformPackage.uploadAPIProject({
      directory: resourceBuildDir,
      upload: async (blob) => {
<<<<<<< HEAD
        const { Key, Body } = blob
        const fullKey = `${deploymentRootKey}/${Key}`
        return await s3Client.uploadFile({
          Key: fullKey,
          Body
        })
      }
    })
=======
        const { Key, Body } = blob;
        const fullKey = `${deploymentRootKey}/${Key}`;
        return await s3Client.uploadFile({
          Key: fullKey,
          Body,
        });
      },
    });
>>>>>>> 9378224b7137c1d316f9baa07f650abe84c5a79d

    const parametersFilePath = path.join(backEndDir, category, resourceName, 'parameters.json');
    let currentParameters;

    if (fs.existsSync(parametersFilePath)) {
      try {
        currentParameters = JSON.parse(fs.readFileSync(parametersFilePath));
      } catch (e) {
        currentParameters = {};
      }
    }

    Object.assign(currentParameters, {
      S3DeploymentBucket: projectBucket,
<<<<<<< HEAD
      S3DeploymentRootKey: deploymentRootKey
=======
      S3DeploymentRootKey: deploymentRootKey,
>>>>>>> 9378224b7137c1d316f9baa07f650abe84c5a79d
    });
    const jsonString = JSON.stringify(currentParameters, null, 4);
    fs.writeFileSync(parametersFilePath, jsonString, 'utf8');
  }
}

module.exports = {
  uploadAppSyncFiles,
};
