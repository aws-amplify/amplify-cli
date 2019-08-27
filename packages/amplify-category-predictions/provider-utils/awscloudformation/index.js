import open from 'open';

const path = require('path');
const chalk = require('chalk');

const parametersFileName = 'parameters.json';
const prefixForAdminTrigger = 'protected/predictions/index-faces/admin';

function addResource(context, category, predictionsCategoryFilename, options) {
  const predictionCtgWalkthroughSrc = `${__dirname}/prediction-category-walkthroughs/${predictionsCategoryFilename}`;
  const { addWalkthrough } = require(predictionCtgWalkthroughSrc);

  return addWalkthrough(context)
    .then(async (resources) => {
      options = Object.assign(options, resources);
      delete options.resourceName;
      context.amplify.updateamplifyMetaAfterResourceAdd(
        category,
        resources.resourceName,
        options,
      );
      return resources.resourceName;
    });
}

function updateResource(context, predictionsCategoryFilename) {
  const predictionCtgWalkthroughSrc = `${__dirname}/prediction-category-walkthroughs/${predictionsCategoryFilename}`;
  const { updateWalkthrough } = require(predictionCtgWalkthroughSrc);

  if (!updateWalkthrough) {
    context.print.error('Update functionality not available for this service');
    process.exit(0);
  }

  return updateWalkthrough(context)
    .then(resource => resource.resourceName);
}

// currently only supports sagemaker and rekognition
async function console(context, resourceObj, amplifyMeta) {
  const service = resourceObj.service;
  const resourceName = resourceObj.name;
  let serviceOutput = '';
  if (service === 'SageMaker') {
    const sageMakerOutput = getSageMaker(amplifyMeta);
    if (sageMakerOutput) {
      const { Region } = amplifyMeta.providers.awscloudformation;
      await openEndpointDetails(context, Region, sageMakerOutput.endpointName);
      serviceOutput = sageMakerOutput;
    } else {
      context.print.error('Infer resources have NOT been created for your project.');
    }
  }

  if (service === 'Rekognition') {
    await printRekognitionUploadUrl(context, resourceName, amplifyMeta);
  }

  return serviceOutput;
}

async function openEndpointDetails(context, region, endpointName) {
  const endpointConsoleUrl =
    `https://${region}.console.aws.amazon.com/sagemaker/home?region=${region}#/endpoints/${endpointName}`;
  await open(endpointConsoleUrl, { wait: false });
  context.print.info('Endpoint Console:');
  context.print.success(endpointConsoleUrl);
}

function getSageMaker(amplifyMeta) {
  let sagemakerOutput;
  const categoryMeta = amplifyMeta.predictions;
  const services = Object.keys(categoryMeta);
  for (let i = 0; i < services.length; i += 1) {
    const serviceMeta = categoryMeta[services[i]];
    if (serviceMeta.service === 'SageMaker' &&
      serviceMeta.output &&
      serviceMeta.output.endpointName) {
      sagemakerOutput = serviceMeta.output;
      break;
    }
  }
  return sagemakerOutput;
}

async function printRekognitionUploadUrl(context, resourceName, amplifyMeta, showOnAmplifyStatus) {
  const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
  const resourceDirPath = path.join(projectBackendDirPath, 'predictions', resourceName);
  const parametersFilePath = path.join(resourceDirPath, parametersFileName);
  const parameters = context.amplify.readJsonFile(parametersFilePath);
  if (parameters.adminTask) {
    const projectStorage = amplifyMeta.storage;
    const keys = Object.keys(projectStorage);
    let bucketName = '';
    keys.forEach((resource) => {
      if (projectStorage[resource].service === 'S3') {
        if (projectStorage[resource].output) {
          bucketName = projectStorage[resource].output.BucketName;
        } else {
          context.print.error('Push the resources to the cloud using `amplify push` command.');
          process.exit(0);
        }
      }
    });

    if (bucketName === '' || !(amplifyMeta.predictions[resourceName].output && amplifyMeta.predictions[resourceName].output.collectionId)) {
      context.print.error('Push the resources to the cloud using `amplify push` command.');
      process.exit(0);
      return;
    }
    const region = amplifyMeta.providers.awscloudformation.Region;
    await openRekognitionUploadUrl(context, bucketName, region, parameters.folderPolicies, showOnAmplifyStatus);
  } else if (!showOnAmplifyStatus) {
    // !showOnAmplifyStatus is used so that this message is not shown in amplify status scenario.
    context.print.error('Console command not supported for your configuration in the project. Use ‘amplify update predictions’ to modify your configurations.');
    process.exit(0);
  }
}

async function openRekognitionUploadUrl(context, bucketName, region, folderPolicies, printOnlyURL) {
  const URL = folderPolicies === 'admin' ? `https://s3.console.aws.amazon.com/s3/buckets/${bucketName}/${prefixForAdminTrigger}/admin/?region=${region}`
    : `https://s3.console.aws.amazon.com/s3/buckets/${bucketName}/${prefixForAdminTrigger}/?region=${region}`;
  if (!printOnlyURL) {
    await open(URL, { wait: false });
  }
  context.print.info(chalk`Rekognition endpoint to upload Images: {blue.underline ${URL}} (Amazon Rekognition only supports uploading PNG and JPEG files)`);
}

module.exports = {
  addResource, updateResource, console, printRekognitionUploadUrl,
};
