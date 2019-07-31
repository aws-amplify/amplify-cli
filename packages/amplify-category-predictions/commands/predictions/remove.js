const path = require('path');
const fs = require('fs-extra');

const subcommand = 'remove';
const category = 'predictions';
const storageCategory = 'storage';
const parametersFileName = 'parameters.json';
const amplifyMetaFilename = 'amplify-meta.json';
const s3CloudFormationTemplateFile = 's3-cloudformation-template.json';

module.exports = {
  name: subcommand,
  run: async (context) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify.removeResource(context, category, resourceName)
      .then(() => {
        const projectDetails = context.amplify.getProjectDetails();
        const projectStorage = projectDetails.amplifyMeta.storage;
        if (!projectStorage) {
          process.exit(0);
          return;
        }
        const keys = Object.keys(projectStorage);
        let s3ResourceName = '';
        keys.forEach((resource) => {
          if (projectStorage[resource].service === 'S3') {
            s3ResourceName = resource;
          }
        });

        if (s3ResourceName === '') {
          process.exit(0);
          return;
        }

        const projectBackendDirPath = context.amplify.pathManager.getBackendDirPath();
        const resourceDirPath = path.join(projectBackendDirPath, storageCategory, s3ResourceName);
        const parametersFilePath = path.join(resourceDirPath, parametersFileName);
        const bucketParameters = context.amplify.readJsonFile(parametersFilePath);
        const adminTriggerFunction = bucketParameters.adminTriggerFunction;

        if (adminTriggerFunction) {
          const predictionCtgWalkthroughSrc = `${__dirname}/../../provider-utils/awscloudformation/prediction-category-walkthroughs/identify-walkthrough`;
          const { removeS3AdminLambdaTrigger } = require(predictionCtgWalkthroughSrc);
          const storageCFNFilePath = path.join(projectBackendDirPath, storageCategory, s3ResourceName, s3CloudFormationTemplateFile);
          let storageCFNFile = context.amplify.readJsonFile(storageCFNFilePath);
          storageCFNFile = removeS3AdminLambdaTrigger(storageCFNFile, adminTriggerFunction);
          delete bucketParameters.adminTriggerFunction;
          const amplifyMetaFilePath = path.join(projectBackendDirPath, amplifyMetaFilename);
          const amplifyMetaFile = context.amplify.readJsonFile(amplifyMetaFilePath);
          const s3DependsOnResources = amplifyMetaFile.storage[s3ResourceName].dependsOn;
          const s3Resources = [];
          s3DependsOnResources.forEach((resource) => {
            if (resource.resourceName !== adminTriggerFunction) {
              s3Resources.push(resource);
            }
          });

          const jsonString = JSON.stringify(bucketParameters, null, 4);
          fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

          const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
          fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
          context.amplify.updateamplifyMetaAfterResourceUpdate(
            storageCategory,
            s3ResourceName,
            'dependsOn',
            s3Resources,
          );
        }
      })
      .catch((err) => {
        context.print.info(err.stack);
        context.print.error('An error occurred when removing the predictions resource');
      });
  },
};
