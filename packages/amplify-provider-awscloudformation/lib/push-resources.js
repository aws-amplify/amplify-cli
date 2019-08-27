const fs = require('fs-extra');
const path = require('path');
const cfnLint = require('cfn-lint');
const ora = require('ora');
const S3 = require('../src/aws-utils/aws-s3');
const Cloudformation = require('../src/aws-utils/aws-cfn');
const providerName = require('./constants').ProviderName;
const { buildResource } = require('./build-resources');
const { uploadAppSyncFiles } = require('./upload-appsync-files');
const { prePushGraphQLCodegen, postPushGraphQLCodegen } = require('./graphql-codegen');
const { transformGraphQLSchema } = require('./transform-graphql-schema');
const { displayHelpfulURLs } = require('./display-helpful-urls');
const { downloadAPIModels } = require('./download-api-models');
const { loadResourceParameters } = require('../src/resourceParams');
const { uploadAuthTriggerFiles } = require('./upload-auth-trigger-files');
const archiver = require('../src/utils/archiver');

const spinner = ora('Updating resources in the cloud. This may take a few minutes...');
const nestedStackFileName = 'nested-cloudformation-stack.yml';
const optionalBuildDirectoryName = 'build';

async function run(context, resourceDefinition) {
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    allResources,
  } = resourceDefinition;

  const resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  let projectDetails = context.amplify.getProjectDetails();

  validateCfnTemplates(context, resources);

  return packageResources(context, resources)
    .then(() => transformGraphQLSchema(context, {
      noConfig: true,
      handleMigration: opts =>
        updateStackForAPIMigration(context, 'api', undefined, opts),
    }))
    .then(() => uploadAppSyncFiles(context, resources, allResources))
    .then(() => prePushGraphQLCodegen(context, resourcesToBeCreated, resourcesToBeUpdated))
    .then(() => updateS3Templates(context, resources, projectDetails.amplifyMeta))
    .then(() => {
      spinner.start();
      projectDetails = context.amplify.getProjectDetails();
      if (resources.length > 0 || resourcesToBeDeleted.length > 0) {
        return updateCloudFormationNestedStack(
          context,
          formNestedStack(context, projectDetails), resourcesToBeCreated, resourcesToBeUpdated,
        );
      }
    })
    .then(() => postPushGraphQLCodegen(context))
    .then(async () => {
      if (resources.length > 0) {
        await context.amplify.updateamplifyMetaAfterPush(resources);
      }
      for (let i = 0; i < resourcesToBeDeleted.length; i += 1) {
        context.amplify.updateamplifyMetaAfterResourceDelete(
          resourcesToBeDeleted[i].category,
          resourcesToBeDeleted[i].resourceName,
        );
      }
    })
    .then(() => uploadAuthTriggerFiles(context, resourcesToBeCreated, resourcesToBeUpdated))
    .then(async () => {
      let {
        allResources,
      } = await context.amplify.getResourceStatus();


      const newAPIresources = [];

      allResources = allResources.filter(resource => resource.service === 'API Gateway');

      for (let i = 0; i < allResources.length; i += 1) {
        if (resources.findIndex(resource => resource.resourceName
          === allResources[i].resourceName) > -1) {
          newAPIresources.push(allResources[i]);
        }
      }

      return downloadAPIModels(context, newAPIresources);
    })
    .then(() =>
      // Store current cloud backend in S3 deployment bcuket
      storeCurrentCloudBackend(context))
    .then(() => {
      spinner.succeed('All resources are updated in the cloud');
      displayHelpfulURLs(context, resources);
    })
    .catch((err) => {
      spinner.fail('An error occurred when pushing the resources to the cloud');
      throw err;
    });
}

async function updateStackForAPIMigration(context, category, resourceName, options) {
  const {
    resourcesToBeCreated,
    resourcesToBeUpdated,
    resourcesToBeDeleted,
    allResources,
  } = await context.amplify.getResourceStatus(category, resourceName, providerName);

  const { isReverting, isCLIMigration } = options;
  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  let projectDetails = context.amplify.getProjectDetails();

  validateCfnTemplates(context, resources);

  resources = allResources.filter(resource => resource.service === 'AppSync');

  return packageResources(context, resources)
    .then(() => uploadAppSyncFiles(context, resources, allResources, {
      useDeprecatedParameters: isReverting, defaultParams: { APIKeyExpirationEpoch: -1 },
    }))
    .then(() => updateS3Templates(context, resources, projectDetails.amplifyMeta))
    .then(() => {
      if (!isCLIMigration) {
        spinner.start();
      }
      projectDetails = context.amplify.getProjectDetails();
      if (resources.length > 0 || resourcesToBeDeleted.length > 0) {
        // isCLIMigration implies a top level CLI migration is underway.
        // We do not inject an env in such situations so we pass a resourceName.
        // When it is an API level migration, we do pass an env so omit the resourceName.
        let nestedStack;
        if (isReverting && isCLIMigration) {
          // When this is a CLI migration and we are rolling back, we do not want to inject
          // an [env] for any templates.
          nestedStack = formNestedStack(context, projectDetails, category, resourceName, 'AppSync', true);
        } else if (isCLIMigration) {
          nestedStack = formNestedStack(context, projectDetails, category, resourceName, 'AppSync');
        } else {
          nestedStack = formNestedStack(context, projectDetails, category);
        }
        return updateCloudFormationNestedStack(
          context,
          nestedStack,
          resourcesToBeCreated, resourcesToBeUpdated,
        );
      }
    })
    .then(async (res) => {
      await context.amplify.updateamplifyMetaAfterPush(resources);
      if (!isCLIMigration) {
        spinner.stop();
      }
      return res;
    })
    .catch((err) => {
      if (!isCLIMigration) {
        spinner.fail('An error occured when migrating the API project.');
      }
      throw err;
    });
}

function storeCurrentCloudBackend(context) {
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = `${backendDir}/.temp`;
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
  return archiver.run(currentCloudBackendDir, zipFilePath)
    .then((result) => {
      const s3Key = `${result.zipFilename}`;
      return new S3(context)
        .then((s3) => {
          const s3Params = {
            Body: fs.createReadStream(result.zipFilePath),
            Key: s3Key,
          };
          return s3.uploadFile(s3Params);
        });
    })
    .then(() => {
      fs.removeSync(tempDir);
    });
}

function validateCfnTemplates(context, resourcesToBeUpdated) {
  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    const { category, resourceName } = resourcesToBeUpdated[i];
    const backEndDir = context.amplify.pathManager.getBackendDirPath();
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const files = fs.readdirSync(resourceDir);
    // Fetch all the Cloudformation templates for the resource (can be json or yml)
    const cfnFiles = files.filter(file => file.indexOf('template') !== -1 && file.indexOf('.') !== 0);
    for (let j = 0; j < cfnFiles.length; j += 1) {
      const filePath = path.normalize(path.join(resourceDir, cfnFiles[j]));
      try {
        cfnLint.validateFile(filePath);
      } catch (err) {
        context.print.error(`Invalid CloudFormation template: ${filePath}`);
        throw err;
      }
    }
  }
}

function packageResources(context, resources) {
  // Only build and package resources which are required
  resources = resources.filter(resource => resource.build);

  const packageResource = (context, resource) => {
    let s3Key;
    return buildResource(context, resource)
      .then((result) => {
        // Upload zip file to S3
        s3Key = `amplify-builds/${result.zipFilename}`;
        return new S3(context)
          .then((s3) => {
            const s3Params = {
              Body: fs.createReadStream(result.zipFilePath),
              Key: s3Key,
            };
            return s3.uploadFile(s3Params);
          });
      })
      .then((s3Bucket) => {
      // Update cfn template
        const { category, resourceName } = resource;
        const backEndDir = context.amplify.pathManager.getBackendDirPath();
        const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));

        const files = fs.readdirSync(resourceDir);
        // Fetch all the Cloudformation templates for the resource (can be json or yml)
        const cfnFiles = files.filter(file =>
          (file.indexOf('template') !== -1) && /\.(json|yaml|yml)$/.test(file));

        if (cfnFiles.length !== 1) {
          context.print.error('Only one CloudFormation template is allowed in the resource directory');
          context.print.error(resourceDir);
          throw new Error('Only one CloudFormation template is allowed in the resource directory');
        }

        const cfnFile = cfnFiles[0];
        const cfnFilePath = path.normalize(path.join(resourceDir, cfnFile));

        const cfnMeta = context.amplify.readJsonFile(cfnFilePath);

        if (cfnMeta.Resources.LambdaFunction.Type === 'AWS::Serverless::Function') {
          cfnMeta.Resources.LambdaFunction.Properties.CodeUri = {
            Bucket: s3Bucket,
            Key: s3Key,
          };
        } else {
          cfnMeta.Resources.LambdaFunction.Properties.Code = {
            S3Bucket: s3Bucket,
            S3Key: s3Key,
          };
        }

        const jsonString = JSON.stringify(cfnMeta, null, '\t');
        fs.writeFileSync(cfnFilePath, jsonString, 'utf8');
      });
  };

  const promises = [];
  for (let i = 0; i < resources.length; i += 1) {
    promises.push(packageResource(context, resources[i]));
  }

  return Promise.all(promises);
}


function updateCloudFormationNestedStack(
  context, nestedStack,
  resourcesToBeCreated,
  resourcesToBeUpdated,
) {
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const nestedStackFilepath = path.normalize(path.join(
    backEndDir,
    providerName,
    nestedStackFileName,
  ));

  const uniqueCategoriesAdded = getAllUniqueCategories(resourcesToBeCreated);
  const uniqueCategoriesUpdated = getAllUniqueCategories(resourcesToBeUpdated);

  let userAgentAction = '';

  if (uniqueCategoriesAdded.length > 0) {
    uniqueCategoriesAdded.forEach((category) => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }

      userAgentAction += `${category}:c `;
    });
  }

  if (uniqueCategoriesUpdated.length > 0) {
    uniqueCategoriesUpdated.forEach((category) => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }
      userAgentAction += `${category}:u `;
    });
  }

  const jsonString = JSON.stringify(nestedStack, null, '\t');
  context.filesystem.write(nestedStackFilepath, jsonString);

  return new Cloudformation(context, userAgentAction)
    .then(cfnItem => cfnItem.updateResourceStack(
      path.normalize(path.join(backEndDir, providerName)),
      nestedStackFileName,
    ));
}

function getAllUniqueCategories(resources) {
  const categories = new Set();

  resources.forEach(resource => categories.add(resource.category));

  return [...categories];
}

function getCfnFiles(context, category, resourceName) {
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
  const resourceBuildDir = path.join(resourceDir, optionalBuildDirectoryName);
  /**
   * The API category w/ GraphQL builds into a build/ directory.
   * This looks for a build directory and uses it if one exists.
   * Otherwise falls back to the default behavior.
   */
  if (fs.existsSync(resourceBuildDir) && fs.lstatSync(resourceBuildDir).isDirectory()) {
    const files = fs.readdirSync(resourceBuildDir);
    const cfnFiles = files
      .filter(file => file.indexOf('.') !== 0)
      .filter(file => file.indexOf('template') !== -1);
    return {
      resourceDir: resourceBuildDir,
      cfnFiles,
    };
  }
  const files = fs.readdirSync(resourceDir);
  const cfnFiles = files
    .filter(file => file.indexOf('.') !== 0)
    .filter(file => file.indexOf('template') !== -1);
  return {
    resourceDir,
    cfnFiles,
  };
}

function updateS3Templates(context, resourcesToBeUpdated, amplifyMeta) {
  const promises = [];

  for (let i = 0; i < resourcesToBeUpdated.length; i += 1) {
    const { category, resourceName } = resourcesToBeUpdated[i];
    const { resourceDir, cfnFiles } = getCfnFiles(context, category, resourceName);
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
        Key: `amplify-cfn-templates/${category}/${cfnFile}`,
      };
      return s3.uploadFile(s3Params);
    })
    .then((projectBucket) => {
      const templateURL = `https://s3.amazonaws.com/${projectBucket}/amplify-cfn-templates/${category}/${cfnFile}`;
      const providerMetadata = amplifyMeta[category][resourceName].providerMetadata || {};
      providerMetadata.s3TemplateURL = templateURL;
      providerMetadata.logicalId = category + resourceName;
      context.amplify.updateamplifyMetaAfterResourceUpdate(category, resourceName, 'providerMetadata', providerMetadata);
    });
}

/* eslint-disable */
function formNestedStack(context, projectDetails, categoryName, resourceName, serviceName, skipEnv) {
/* eslint-enable */
  const nestedStack = context.amplify.readJsonFile(`${__dirname}/rootStackTemplate.json`);
  const { amplifyMeta } = projectDetails;
  let authResourceName;
  let categories = Object.keys(amplifyMeta);
  categories = categories.filter(category => category !== 'provider');
  categories.forEach((category) => {
    const resources = Object.keys(amplifyMeta[category]);
    resources.forEach((resource) => {
      const resourceDetails = amplifyMeta[category][resource];
      if (category === 'auth') {
        authResourceName = resource;
      }
      const resourceKey = category + resource;
      let templateURL;
      if (resourceDetails.providerPlugin) {
        const parameters = loadResourceParameters(context, category, resource);
        const { dependsOn } = resourceDetails;

        if (dependsOn) {
          for (let i = 0; i < dependsOn.length; i += 1) {
            for (let j = 0; j < dependsOn[i].attributes.length; j += 1) {
              const parameterKey = dependsOn[i].category +
              dependsOn[i].resourceName +
              dependsOn[i].attributes[j];
              const dependsOnStackName = dependsOn[i].category + dependsOn[i].resourceName;

              parameters[parameterKey] = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${dependsOn[i].attributes[j]}`] };
            }
          }
        }

        const values = Object.values(parameters);
        const keys = Object.keys(parameters);
        for (let a = 0; a < values.length; a += 1) {
          if (Array.isArray(values[a])) {
            parameters[keys[a]] = values[a].join();
          }
        }

        const currentEnv = context.amplify.getEnvInfo().envName;

        if (!skipEnv && resourceName) {
          if (resource === resourceName &&
            category === categoryName &&
            amplifyMeta[category][resource].service === serviceName) {
            Object.assign(parameters, { env: currentEnv });
          }
        } else if (!skipEnv) {
          Object.assign(parameters, { env: currentEnv });
        }

        if (resourceDetails.providerMetadata) {
          templateURL = resourceDetails.providerMetadata.s3TemplateURL;
          nestedStack.Resources[resourceKey] = {
            Type: 'AWS::CloudFormation::Stack',
            Properties: {
              TemplateURL: templateURL,
              Parameters: parameters,
            },
          };
        }
      }
    });
  });

  if (authResourceName) {
    updateIdPRolesInNestedStack(context, nestedStack, authResourceName);
  }
  return nestedStack;
}

function updateIdPRolesInNestedStack(context, nestedStack, authResourceName) {
  const authLogicalResourceName = `auth${authResourceName}`;
  const idpUpdateRoleCfn = context.amplify.readJsonFile(`${__dirname}/update-idp-roles-cfn.json`);

  idpUpdateRoleCfn.UpdateRolesWithIDPFunction.DependsOn.push(authLogicalResourceName);
  idpUpdateRoleCfn.UpdateRolesWithIDPFunctionOutputs.Properties.idpId['Fn::GetAtt'].unshift(authLogicalResourceName);

  Object.assign(nestedStack.Resources, idpUpdateRoleCfn);
}

module.exports = {
  run,
  updateStackForAPIMigration,
};
