const fs = require('fs');
const path = require('path');
const S3 = require('../src/aws-utils/aws-s3');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const providerName = require('../constants').ProviderName;

const nestedStackFileName = 'nested-cloudformation-stack.yml';

function run(context, category, resourceName) {
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
  } = context.amplify.getResourceStatus(category, resourceName);
  const resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  let projectDetails = context.amplify.getProjectDetails();

  return updateS3Templates(context, resources, projectDetails.amplifyMeta)
    .then(() => {
      projectDetails = context.amplify.getProjectDetails();
      if (resources.length > 0 || resourcesToBeDeleted.length > 0) {
        return updateCloudFormationNestedStack(
          context,
          formNestedStack(projectDetails.amplifyMeta), resourcesToBeDeleted,
        );
      }
    })
    .then(() => {
      if (resources.length > 0) {
        context.amplify.updateamplifyMetaAfterPush(resources);
      }
      for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
        context.amplify.updateamplifyMetaAfterResourceDelete(
          resourcesToBeDeleted[i].category,
          resourcesToBeDeleted[i].resourceName,
        );
      }
    });
}

function updateCloudFormationNestedStack(context, nestedStack) {
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
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

function updateS3Templates(context, resourcesToBeUpdated, amplifyMeta) {
  const promises = [];

  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    const { category, resourceName } = resourcesToBeUpdated[i];
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
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
        amplifyMeta,
      ));
    }
  }

  return Promise.all(promises);
}

function uploadTemplateToS3(context, resourceDir, cfnFile, category, resourceName, amplifyMeta) {
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
      const providerMetadata = amplifyMeta[category][resourceName].providerMetadata || {};
      providerMetadata.s3TemplateURL = templateURL;
      providerMetadata.logicalId = category + resourceName;
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'providerMetadata', providerMetadata);
    });
}

function formNestedStack(amplifyMeta) {
  const nestedStack = JSON.parse(fs.readFileSync(`${__dirname}/rootStackTemplate.json`));

  let categories = Object.keys(amplifyMeta);
  categories = categories.filter(category => category !== 'provider');
  categories.forEach((category) => {
    const resources = Object.keys(amplifyMeta[category]);

    resources.forEach((resource) => {
      const resourceDetails = amplifyMeta[category][resource];
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

module.exports = {
  run,
};
