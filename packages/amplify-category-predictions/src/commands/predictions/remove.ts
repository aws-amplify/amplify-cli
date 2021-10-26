// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'path'.
const path = require('path');
const fs = require('fs-extra');

// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'subcommand... Remove this comment to see the full error message
const subcommand = 'remove';
const category = 'predictions';
const storageCategory = 'storage';
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'parameters... Remove this comment to see the full error message
const parametersFileName = 'parameters.json';
const amplifyMetaFilename = 'amplify-meta.json';
const s3CloudFormationTemplateFile = 's3-cloudformation-template.json';
// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'exitOnNext... Remove this comment to see the full error message
const { ResoureNotFoundError, exitOnNextTick } = require('amplify-cli-core');
module.exports = {
  name: subcommand,
  run: async (context: any) => {
    const { amplify, parameters } = context;
    const resourceName = parameters.first;

    return amplify
      .removeResource(context, category, resourceName)
      .then(() => {
        const projectDetails = context.amplify.getProjectDetails();
        const projectStorage = projectDetails.amplifyMeta.storage;
        if (!projectStorage) {
          context.usageData.emitError(new ResoureNotFoundError('Project storage not found'));
          exitOnNextTick(0);
          return;
        }
        const keys = Object.keys(projectStorage);
        let s3ResourceName = '';
        keys.forEach(resource => {
          if (projectStorage[resource].service === 'S3') {
            s3ResourceName = resource;
          }
        });

        if (s3ResourceName === '') {
          context.usageData.emitError(new ResoureNotFoundError('S3 Resource does not exist'));
          exitOnNextTick(0);
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
          const s3Resources: any = [];
          s3DependsOnResources.forEach((resource: any) => {
            if (resource.resourceName !== adminTriggerFunction) {
              s3Resources.push(resource);
            }
          });

          const jsonString = JSON.stringify(bucketParameters, null, 4);
          fs.writeFileSync(parametersFilePath, jsonString, 'utf8');

          const storageCFNString = JSON.stringify(storageCFNFile, null, 4);
          fs.writeFileSync(storageCFNFilePath, storageCFNString, 'utf8');
          context.amplify.updateamplifyMetaAfterResourceUpdate(storageCategory, s3ResourceName, 'dependsOn', s3Resources);
        }
      })
      .catch((err: any) => {
        context.print.info(err.stack);
        context.print.error('An error occurred when removing the predictions resource');
        context.usageData.emitError(err);
        process.exitCode = 1;
      });
  },
};
