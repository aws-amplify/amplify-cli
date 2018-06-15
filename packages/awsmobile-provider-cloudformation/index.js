const fs = require('fs');
const path = require('path');
const moment = require('moment');
const S3 = require('./src/aws-utils/aws-s3');
const Cloudformation = require('./src/aws-utils/aws-cfn');
const providerName = require('./constants').ProviderName;
const configurationManager = require('./lib/configuration-manager');

const nestedStackFileName = 'nested-cloudformation-stack.yml';

function init(context) {
  const config = configurationManager.getConfiguration(context);
  const initTemplateFilePath = `${__dirname}/lib/rootStackTemplate.json`;
  const timeStamp = `-${moment().format('YYYYMMDDHHmmss')}`;
  const stackName = context.initInfo.projectName + timeStamp;
  const deploymentBucketName = `${stackName}-deployment`;
  const params = {
    StackName: stackName,
    TemplateBody: fs.readFileSync(initTemplateFilePath).toString(),
    Parameters: [
      {
        ParameterKey: 'DeploymentBucketName',
        ParameterValue: deploymentBucketName,
      },
    ],
  };

  return new Cloudformation(context)
    .then(cfnItem => cfnItem.createResourceStack(params))
    .then((data) => {
      processStackCreationData(context, config.region, params, data);
      return context;
    });
}

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
  const backEndDir = context.awsmobile.pathManager.getBackendDirPath();
  const nestedStackFilepath = path.normalize(path.join(
    backEndDir,
    providerName,
    nestedStackFileName,
  ));

  const jsonString = JSON.stringify(nestedStack, null, '\t');
  context.filesystem.write(nestedStackFilepath, jsonString);

  return new Cloudformation(context)
    .then(cfnItem => cfnItem.updateResourceStack(
      path.normalize(path.join(backEndDir, providerName)),
      nestedStackFileName,
    ));
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
  const nestedStack = JSON.parse(fs.readFileSync(`${__dirname}/lib/rootStackTemplate.json`));

  let categories = Object.keys(awsmobileMeta);
  categories = categories.filter(category => category !== 'provider');
  categories.forEach((category) => {
    const resources = Object.keys(awsmobileMeta[category]);

    resources.forEach((resource) => {
      const resourceDetails = awsmobileMeta[category][resource];
      const resourceKey = category + resource;
      let templateURL;
      if (resourceDetails.providerMetadata) {
        templateURL = resourceDetails.providerMetadata.s3TemplateURL;
        nestedStack.Resources[resourceKey] = {
          Type: 'AWS::CloudFormation::Stack',
          Properties: {
            TemplateURL: templateURL,
          },
        };
      }
    });
  });

  return nestedStack;
}

function processStackCreationData(context, region, params, data) {
  const metaData = {
    Region: region,
    StackId: data.StackId,
    StackName: params.StackName,
    DeploymentBucket: params.Parameters[0].ParameterValue,
  };
  context.initInfo.metaData.provider = {};

  context.initInfo.metaData.provider['awsmobile-provider-cloudformation'] = metaData;
}


module.exports = {
  init,
  pushResources,
};
