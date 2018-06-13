const fs = require('fs');
const path = require('path');
const S3 = require('./src/aws-utils/aws-s3');
const Cloudformation = require('./src/aws-utils/aws-cfn');
const providerName = require('./constants').ProviderName;

const nestedStackFileName = 'nested-cloudformation-stack.yml';

function pushResources(context, category, resourceName) {
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
  } = context.awsmobile.getResourceStatus(category, resourceName);
  const resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  let projectDetails = context.awsmobile.getProjectDetails();

  return updateS3Templates(context, resources, projectDetails.awsmobileMeta)
    .then(() => {
      projectDetails = context.awsmobile.getProjectDetails();
      if (resources.length > 0 || resourcesToBeDeleted.length > 0) {
        return updateCloudFormationNestedStack(
          context,
          formNestedStack(projectDetails.awsmobileMeta), resourcesToBeDeleted,
        );
      }
    })
    .then(() => {
      if (resources.length > 0) {
        context.awsmobile.updateAwsMobileMetaAfterPush(resources);
      }
      for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
        context.awsmobile.updateAwsMobileMetaAfterResourceDelete(
          resourcesToBeDeleted[i].category,
          resourcesToBeDeleted[i].resourceName,
        );
      }
    });
}

function updateCloudFormationNestedStack(context, nestedStack) {
  const { awsmobile } = context;
  const backEndDir = context.awsmobile.pathManager.getBackendDirPath();
  const nestedStackFilepath = path.normalize(path.join(
    backEndDir,
    providerName,
    nestedStackFileName,
  ));

  const jsonString = JSON.stringify(nestedStack, null, '\t');
  context.filesystem.write(nestedStackFilepath, jsonString);

  return new Cloudformation(context)
    .then((cfnItem) => {
      if (Object.keys(nestedStack.Resources).length === 0) {
        return cfnItem.deleteResourceStack()
          .then(() => {
            const awsmobileMetaFilePath = awsmobile.pathManager.getAwsmobileMetaFilePath();
            /* eslint-disable */
            const awsmobileCloudMetaFilePath = awsmobile.pathManager.getCurentBackendCloudAwsmobileMetaFilePath();
            /* eslint-enable */
            removeStackNameInAwsMetaFile(awsmobileMetaFilePath);
            removeStackNameInAwsMetaFile(awsmobileCloudMetaFilePath);
          });
      }
      return cfnItem.updateResourceStack(
        path.normalize(path.join(backEndDir, providerName)),
        nestedStackFileName,
      );
    });
}

function removeStackNameInAwsMetaFile(awsmobileMetaFilePath) {
  const awsmobileMeta = JSON.parse(fs.readFileSync(awsmobileMetaFilePath));
  if (awsmobileMeta.provider) {
    if (awsmobileMeta.provider[providerName]) {
      delete awsmobileMeta.provider[providerName].parentStackName;
      const jsonString = JSON.stringify(awsmobileMeta, null, '\t');
      fs.writeFileSync(awsmobileMetaFilePath, jsonString, 'utf8');
    }
  }
}

function updateS3Templates(context, resourcesToBeUpdated, awsmobileMeta) {
  const promises = [];

  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    const { category, resourceName } = resourcesToBeUpdated[i];
    const backEndDir = context.awsmobile.pathManager.getBackendDirPath();
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const files = fs.readdirSync(resourceDir);
    // Fetch all the Cloudformation templates for the resource (can be json or yml)
    const cfnFiles = files.filter(file => ((file.indexOf('yml') !== -1) || (file.indexOf('json') !== -1)));

    for (let j = 0; j < cfnFiles.length; j += 1) {
      promises.push(uploadTemplateToS3(
        context,
        resourceDir,
        cfnFiles[j],
        category,
        resourceName,
        awsmobileMeta,
      ));
    }
  }

  return Promise.all(promises);
}

function uploadTemplateToS3(context, resourceDir, cfnFile, category, resourceName, awsmobileMeta) {
  const filePath = path.normalize(path.join(resourceDir, cfnFile));

  return new S3(context)
    .then((s3) => {
      const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: cfnFile,
      };
      return s3.uploadFile(s3Params);
    })
    .then((projectBucket) => {
      const templateURL = `https://s3.amazonaws.com/${projectBucket}/${cfnFile}`;
      const providerMetadata = awsmobileMeta[category][resourceName].providerMetadata || {};
      providerMetadata.s3TemplateURL = templateURL;
      providerMetadata.logicalId = category + resourceName;
      context.awsmobile.updateAwsMobileMetaAfterResourceUpdate(category, resourceName, 'providerMetadata', providerMetadata);
    });
}

function formNestedStack(awsmobileMeta) {
  const nestedStack = {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {},
  };

  let categories = Object.keys(awsmobileMeta);
  categories = categories.filter(category => category !== 'provider');

  categories.forEach((category) => {
    const resources = Object.keys(awsmobileMeta[category]);

    resources.forEach((resource) => {
      const resourceDetails = awsmobileMeta[category][resource];
      const resourceKey = category + resource;
      const templateURL = resourceDetails.providerMetadata.s3TemplateURL;

      nestedStack.Resources[resourceKey] = {
        Type: 'AWS::CloudFormation::Stack',
        Properties: {
          TemplateURL: templateURL,
        },
      };
    });
  });

  return nestedStack;
}


module.exports = {
  pushResources,
};
