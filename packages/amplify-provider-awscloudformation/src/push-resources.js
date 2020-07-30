const _ = require('lodash');
const fs = require('fs-extra');
const path = require('path');
const cfnLint = require('cfn-lint');
const glob = require('glob');
const { pathManager, PathConstants } = require('amplify-cli-core');
const ora = require('ora');
const { S3 } = require('./aws-utils/aws-s3');
const Cloudformation = require('./aws-utils/aws-cfn');
const providerName = require('./constants').ProviderName;
const { buildResource } = require('./build-resources');
const { uploadAppSyncFiles } = require('./upload-appsync-files');
const { prePushGraphQLCodegen, postPushGraphQLCodegen } = require('./graphql-codegen');
const { prePushAuthTransform } = require('./auth-transform');
const { transformGraphQLSchema } = require('./transform-graphql-schema');
const { displayHelpfulURLs } = require('./display-helpful-urls');
const { downloadAPIModels } = require('./download-api-models');
const { loadResourceParameters } = require('./resourceParams');
const { uploadAuthTriggerFiles } = require('./upload-auth-trigger-files');
const archiver = require('./utils/archiver');
const amplifyServiceManager = require('./amplify-service-manager');
const { isMultiEnvLayer, packageLayer, ServiceName: FunctionServiceName } = require('amplify-category-function');
const { stateManager } = require('amplify-cli-core');

const spinner = ora('Updating resources in the cloud. This may take a few minutes...');
const nestedStackFileName = 'nested-cloudformation-stack.yml';
const optionalBuildDirectoryName = 'build';
const cfnTemplateGlobPattern = '*template*.+(yaml|yml|json)';
const parametersJson = 'parameters.json';

async function run(context, resourceDefinition) {
  try {
    const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeSynced, resourcesToBeDeleted, allResources } = resourceDefinition;
    const {
      parameters: { options },
    } = context;
    let resources;
    if (context.exeInfo && context.exeInfo.forcePush) {
      resources = allResources;
    } else {
      resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
    }
    let projectDetails = context.amplify.getProjectDetails();

    validateCfnTemplates(context, resources);

    await packageResources(context, resources);

    await transformGraphQLSchema(context, {
      handleMigration: opts => updateStackForAPIMigration(context, 'api', undefined, opts),
      minify: options['minify'],
    });

    await uploadAppSyncFiles(context, resources, allResources);
    await prePushAuthTransform(context, resources);
    await prePushGraphQLCodegen(context, resourcesToBeCreated, resourcesToBeUpdated);
    await updateS3Templates(context, resources, projectDetails.amplifyMeta);

    spinner.start();

    projectDetails = context.amplify.getProjectDetails();

    // We do not need CloudFormation update if only syncable resources are the changes.
    if (resourcesToBeCreated.length > 0 || resourcesToBeUpdated.length > 0 || resourcesToBeDeleted.length > 0) {
      await updateCloudFormationNestedStack(context, formNestedStack(context, projectDetails), resourcesToBeCreated, resourcesToBeUpdated);
    }

    await postPushGraphQLCodegen(context);
    await amplifyServiceManager.postPushCheck(context);

    if (resources.concat(resourcesToBeDeleted).length > 0) {
      await context.amplify.updateamplifyMetaAfterPush(resources);
    }

    if (resourcesToBeSynced.length > 0) {
      const importResources = resourcesToBeSynced.filter(r => r.sync === 'import');
      const unlinkedResources = resourcesToBeSynced.filter(r => r.sync === 'unlink');

      if (importResources.length > 0) {
        await context.amplify.updateamplifyMetaAfterPush(importResources);
      }

      if (unlinkedResources.length > 0) {
        for (let i = 0; i < unlinkedResources.length; i++) {
          context.amplify.updateamplifyMetaAfterResourceDelete(unlinkedResources[i].category, unlinkedResources[i].resourceName);
        }
      }
    }

    for (let i = 0; i < resourcesToBeDeleted.length; i++) {
      context.amplify.updateamplifyMetaAfterResourceDelete(resourcesToBeDeleted[i].category, resourcesToBeDeleted[i].resourceName);
    }

    await uploadAuthTriggerFiles(context, resourcesToBeCreated, resourcesToBeUpdated);

    let updatedAllResources = (await context.amplify.getResourceStatus()).allResources;

    const newAPIresources = [];

    updatedAllResources = updatedAllResources.filter(resource => resource.service === 'API Gateway');

    for (let i = 0; i < updatedAllResources.length; i++) {
      if (resources.findIndex(resource => resource.resourceName === updatedAllResources[i].resourceName) > -1) {
        newAPIresources.push(updatedAllResources[i]);
      }
    }

    // Check if there was any imported auth resource and if there was we have to refresh the
    // COGNITO_USER_POOLS configuration for AppSync APIs in meta if we have any
    if (resourcesToBeSynced.length > 0) {
      const importResources = resourcesToBeSynced.filter(r => r.sync === 'import');

      if (importResources.length > 0) {
        const { imported, userPoolId } = context.amplify.getImportedAuthProperties(context);

        // Sanity check it will always be true in this case
        if (imported) {
          const appSyncAPIs = allResources.filter(resource => resource.service === 'AppSync');
          const meta = stateManager.getMeta(undefined);
          let hasChanges = false;

          for (const appSyncAPI of appSyncAPIs) {
            const apiResource = _.get(meta, ['api', appSyncAPI.resourceName]);

            if (apiResource) {
              const defaultAuthentication = _.get(apiResource, ['output', 'authConfig', 'defaultAuthentication']);

              if (defaultAuthentication && defaultAuthentication.authenticationType === 'AMAZON_COGNITO_USER_POOLS') {
                defaultAuthentication.userPoolConfig.userPoolId = userPoolId;
                hasChanges = true;
              }

              const additionalAuthenticationProviders = _.get(apiResource, ['output', 'authConfig', 'additionalAuthenticationProviders']);

              for (const additionalAuthenticationProvider of additionalAuthenticationProviders) {
                if (
                  additionalAuthenticationProvider &&
                  additionalAuthenticationProvider.authenticationType === 'AMAZON_COGNITO_USER_POOLS'
                ) {
                  additionalAuthenticationProvider.userPoolConfig.userPoolId = userPoolId;
                  hasChanges = true;
                }
              }
            }
          }

          if (hasChanges) {
            stateManager.setMeta(undefined, meta);
          }
        }
      }
    }

    await downloadAPIModels(context, newAPIresources);

    // Store current cloud backend in S3 deployment bcuket
    await storeCurrentCloudBackend(context);
    await amplifyServiceManager.storeArtifactsForAmplifyService(context);

    spinner.succeed('All resources are updated in the cloud');

    displayHelpfulURLs(context, resources);
  } catch (err) {
    spinner.fail('An error occurred when pushing the resources to the cloud');
    throw err;
  }
}

async function updateStackForAPIMigration(context, category, resourceName, options) {
  const { resourcesToBeCreated, resourcesToBeUpdated, resourcesToBeDeleted, allResources } = await context.amplify.getResourceStatus(
    category,
    resourceName,
    providerName,
  );

  const { isReverting, isCLIMigration } = options;
  let resources = resourcesToBeCreated.concat(resourcesToBeUpdated);
  let projectDetails = context.amplify.getProjectDetails();

  validateCfnTemplates(context, resources);

  resources = allResources.filter(resource => resource.service === 'AppSync');

  return packageResources(context, resources)
    .then(() =>
      uploadAppSyncFiles(context, resources, allResources, {
        useDeprecatedParameters: isReverting,
        defaultParams: {
          CreateAPIKey: 0,
          APIKeyExpirationEpoch: -1,
          authRoleName: {
            Ref: 'AuthRoleName',
          },
          unauthRoleName: {
            Ref: 'UnauthRoleName',
          },
        },
      }),
    )
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
        return updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated);
      }
    })
    .then(async res => {
      await context.amplify.updateamplifyMetaAfterPush(resources);
      if (!isCLIMigration) {
        spinner.stop();
      }
      return res;
    })
    .catch(err => {
      if (!isCLIMigration) {
        spinner.fail('An error occurred when migrating the API project.');
      }
      throw err;
    });
}

function storeCurrentCloudBackend(context) {
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = context.amplify.pathManager.getBackendDirPath();
  const tempDir = path.join(backendDir, '.temp');
  const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
    cwd: pathManager.getAmplifyDirPath(),
    absolute: true,
  });

  const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
  return archiver
    .run(currentCloudBackendDir, zipFilePath, undefined, cliJSONFiles)
    .then(result => {
      const s3Key = `${result.zipFilename}`;
      return S3.getInstance(context).then(s3 => {
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
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
      cwd: resourceDir,
      ignore: [parametersJson],
    });
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
    return (resource.service === FunctionServiceName.LambdaLayer ? packageLayer(context, resource) : buildResource(context, resource))
      .then(result => {
        // Upload zip file to S3
        s3Key = `amplify-builds/${result.zipFilename}`;
        return S3.getInstance(context).then(s3 => {
          const s3Params = {
            Body: fs.createReadStream(result.zipFilePath),
            Key: s3Key,
          };
          return s3.uploadFile(s3Params);
        });
      })
      .then(s3Bucket => {
        // Update cfn template
        const { category, resourceName } = resource;
        const backEndDir = context.amplify.pathManager.getBackendDirPath();
        const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));

        const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
          cwd: resourceDir,
          ignore: [parametersJson],
        });

        if (cfnFiles.length !== 1) {
          const errorMessage =
            cfnFiles.length > 1
              ? 'Only one CloudFormation template is allowed in the resource directory'
              : 'CloudFormation template is missing in the resource directory';
          context.print.error(errorMessage);
          context.print.error(resourceDir);
          throw new Error(errorMessage);
        }

        const cfnFile = cfnFiles[0];
        const cfnFilePath = path.normalize(path.join(resourceDir, cfnFile));
        const cfnMeta = context.amplify.readJsonFile(cfnFilePath);

        if (resource.service === FunctionServiceName.LambdaLayer) {
          if (isMultiEnvLayer(context, resourceName)) {
            const amplifyMeta = stateManager.getMeta();
            const teamProviderInfo = stateManager.getTeamProviderInfo();
            _.set(teamProviderInfo, [context.amplify.getEnvInfo().envName, 'categories', 'function', resourceName], {
              deploymentBucketName: s3Bucket,
              s3Key,
            });
            _.set(amplifyMeta, ['function', resourceName, 's3Bucket'], {
              deploymentBucketName: s3Bucket,
              s3Key,
            });
            stateManager.setMeta(undefined, amplifyMeta);
            stateManager.setTeamProviderInfo(undefined, teamProviderInfo);
          } else {
            cfnMeta.Resources.LambdaLayer.Properties.Content = {
              S3Bucket: s3Bucket,
              S3Key: s3Key,
            };
          }
        } else {
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
        }
        context.amplify.writeObjectAsJson(cfnFilePath, cfnMeta, true);
      });
  };

  const promises = [];
  for (let resource of resources) {
    promises.push(packageResource(context, resource));
  }

  return Promise.all(promises);
}

async function updateCloudFormationNestedStack(context, nestedStack, resourcesToBeCreated, resourcesToBeUpdated) {
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const nestedStackFilepath = path.normalize(path.join(backEndDir, providerName, nestedStackFileName));

  const uniqueCategoriesAdded = getAllUniqueCategories(resourcesToBeCreated);
  const uniqueCategoriesUpdated = getAllUniqueCategories(resourcesToBeUpdated);

  let userAgentAction = '';

  if (uniqueCategoriesAdded.length > 0) {
    uniqueCategoriesAdded.forEach(category => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }

      userAgentAction += `${category}:c `;
    });
  }

  if (uniqueCategoriesUpdated.length > 0) {
    uniqueCategoriesUpdated.forEach(category => {
      if (category.length >= 2) {
        category = category.substring(0, 2);
      }
      userAgentAction += `${category}:u `;
    });
  }

  const jsonString = JSON.stringify(nestedStack, null, '\t');
  context.filesystem.write(nestedStackFilepath, jsonString);

  const cfnItem = await new Cloudformation(context, userAgentAction);

  await cfnItem.updateResourceStack(path.normalize(path.join(backEndDir, providerName)), nestedStackFileName);
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
    const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
      cwd: resourceBuildDir,
      ignore: [parametersJson],
    });

    if (cfnFiles.length > 0) {
      return {
        resourceDir: resourceBuildDir,
        cfnFiles,
      };
    }
  }
  const cfnFiles = glob.sync(cfnTemplateGlobPattern, {
    cwd: resourceDir,
    ignore: [parametersJson],
  });
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
      promises.push(uploadTemplateToS3(context, resourceDir, cfnFiles[j], category, resourceName, amplifyMeta));
    }
  }

  return Promise.all(promises);
}

function uploadTemplateToS3(context, resourceDir, cfnFile, category, resourceName, amplifyMeta) {
  const filePath = path.normalize(path.join(resourceDir, cfnFile));

  return S3.getInstance(context)
    .then(s3 => {
      const s3Params = {
        Body: fs.createReadStream(filePath),
        Key: `amplify-cfn-templates/${category}/${cfnFile}`,
      };
      return s3.uploadFile(s3Params, false);
    })
    .then(projectBucket => {
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
  const initTemplateFilePath = path.join(__dirname, '..', 'resources', 'rootStackTemplate.json');
  const nestedStack = context.amplify.readJsonFile(initTemplateFilePath);
  const { amplifyMeta } = projectDetails;
  let authResourceName;
  let categories = Object.keys(amplifyMeta);
  categories = categories.filter(category => category !== 'provider');
  categories.forEach(category => {
    const resources = Object.keys(amplifyMeta[category]);
    resources.forEach(resource => {
      const resourceDetails = amplifyMeta[category][resource];
      if (category === 'auth' && resource !== 'userPoolGroups') {
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
              // If the depends on resource is an imported resource we cannot form GetAtt type reference
              // since there is no such thing. We have to read the output.{AttributeName} from the meta
              // and inject the value itself into the parameters block
              let parameterValue;

              const dependentResource = _.get(amplifyMeta, [dependsOn[i].category, dependsOn[i].resourceName], undefined);

              if (!dependentResource) {
                throw new Error(`Cannot get resource: ${dependsOn[i].resourceName} from '${dependsOn[i].category}' category.`);
              }

              if (dependentResource.serviceType === 'imported') {
                const outputAttributeValue = _.get(dependentResource, ['output', dependsOn[i].attributes[j]], undefined);

                if (!outputAttributeValue) {
                  const error = new Error(
                    `Cannot read the '${dependsOn[i].attributes[j]}' dependent attribute value from the output section of resource: '${dependsOn[i].resourceName}'.`,
                  );
                  error.stack = undefined;

                  throw error;
                }

                parameterValue = outputAttributeValue;
              } else {
                const dependsOnStackName = dependsOn[i].category + dependsOn[i].resourceName;
                parameterValue = { 'Fn::GetAtt': [dependsOnStackName, `Outputs.${dependsOn[i].attributes[j]}`] };
              }

              const parameterKey = `${dependsOn[i].category}${dependsOn[i].resourceName}${dependsOn[i].attributes[j]}`;

              parameters[parameterKey] = parameterValue;
            }

            if (dependsOn[i].exports) {
              Object.keys(dependsOn[i].exports)
                .map(key => ({ key, value: dependsOn[i].exports[key] }))
                .forEach(({ key, value }) => {
                  parameters[key] = { 'Fn::ImportValue': value };
                });
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
          if (resource === resourceName && category === categoryName && amplifyMeta[category][resource].service === serviceName) {
            Object.assign(parameters, { env: currentEnv });
          }
        } else if (!skipEnv) {
          Object.assign(parameters, { env: currentEnv });
        }

        // If auth is imported check the parameters section of the nested template
        // and if it has auth or unauth role arn or name or userpool id, then inject it from the
        // imported auth resource's properties
        const {
          imported,
          userPoolId,
          authRoleArn,
          authRoleName,
          unauthRoleArn,
          unauthRoleName,
        } = context.amplify.getImportedAuthProperties(context);

        if (category !== 'auth' && resourceDetails.service !== 'Cognito' && imported) {
          if (parameters.AuthCognitoUserPoolId) {
            parameters.AuthCognitoUserPoolId = userPoolId;
          }

          if (parameters.authRoleArn) {
            parameters.authRoleArn = authRoleArn;
          }

          if (parameters.authRoleName) {
            parameters.authRoleName = authRoleName;
          }

          if (parameters.unauthRoleArn) {
            parameters.unauthRoleArn = unauthRoleArn;
          }

          if (parameters.unauthRoleName) {
            parameters.unauthRoleName = unauthRoleName;
          }
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
    const importedAuth = _.get(amplifyMeta, ['auth', authResourceName], undefined);

    // If auth is imported we cannot update the IDP as it is not part of the stack resources we deploy.
    if (importedAuth && importedAuth.serviceType !== 'imported') {
      const authParameters = loadResourceParameters(context, 'auth', authResourceName);
      if (authParameters.identityPoolName) {
        updateIdPRolesInNestedStack(context, nestedStack, authResourceName);
      }
    }
  }

  return nestedStack;
}

function updateIdPRolesInNestedStack(context, nestedStack, authResourceName) {
  const authLogicalResourceName = `auth${authResourceName}`;
  const idpUpdateRoleCfnFilePath = path.join(__dirname, '..', 'resources', 'update-idp-roles-cfn.json');
  const idpUpdateRoleCfn = context.amplify.readJsonFile(idpUpdateRoleCfnFilePath);

  idpUpdateRoleCfn.UpdateRolesWithIDPFunction.DependsOn.push(authLogicalResourceName);
  idpUpdateRoleCfn.UpdateRolesWithIDPFunctionOutputs.Properties.idpId['Fn::GetAtt'].unshift(authLogicalResourceName);

  Object.assign(nestedStack.Resources, idpUpdateRoleCfn);
}

module.exports = {
  run,
  updateStackForAPIMigration,
  storeCurrentCloudBackend,
};
