const fs = require('fs');
const fsext = require('fs-extra');
const path = require('path');

const TransformPackage = require('graphql-transformer-core');
const S3 = require('../src/aws-utils/aws-s3');

const ROOT_APPSYNC_S3_KEY = 'amplify-appsync-files';
const providerName = require('./constants').ProviderName;
const { hashElement } = require('folder-hash');

const PARAM_FILE_NAME = 'parameters.json';
const CF_FILE_NAME = 'cloudformation-template.json';

function getProjectBucket(context) {
  const projectDetails = context.amplify.getProjectDetails();
  const projectBucket = projectDetails.amplifyMeta.providers ? projectDetails.amplifyMeta.providers[providerName].DeploymentBucketName : '';
  return projectBucket;
}
/**
 * Updates build/parameters.json with new timestamps and then uploads the
 * contents of the build/ directory to S3.
 * @param {*} context
 * @param {*} resourcesToUpdate
 * @param {*} allResources
 * @param {*} options
 */
async function uploadAppSyncFiles(context, resourcesToUpdate, allResources, options = {}) {
  const allApiResourceToUpdate = resourcesToUpdate.filter(resource => resource.service === 'AppSync');
  const allApiResources = allResources.filter(resource => resource.service === 'AppSync');
  const { defaultParams, useDeprecatedParameters } = options;
  const backEndDir = context.amplify.pathManager.getBackendDirPath();
  const projectBucket = getProjectBucket(context);

  const getDeploymentRootKey = async resourceDir => {
    let deploymentSubKey;
    if (useDeprecatedParameters) {
      deploymentSubKey = new Date().getTime();
    } else {
      deploymentSubKey = await hashDirectory(resourceDir);
    }
    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${deploymentSubKey}`;
    return deploymentRootKey;
  };

  const getApiKeyConfigured = () => {
    const projectDetails = context.amplify.getProjectDetails();
    const appSyncAPIs = Object.keys(projectDetails.amplifyMeta.api).reduce((acc, apiName) => {
      const api = projectDetails.amplifyMeta.api[apiName];
      if (api.service === 'AppSync') {
        acc.push({ ...api, name: apiName });
      }
      return acc;
    }, []);

    const appSyncApi = appSyncAPIs && appSyncAPIs.length && appSyncAPIs.length > 0 ? appSyncAPIs[0] : undefined;

    let hasApiKey = false;

    if (appSyncApi) {
      // Check for legacy security configuration and multi-auth as well
      const { authConfig, securityType } = appSyncApi.output;

      if (securityType && securityType === 'API_KEY') {
        hasApiKey = true;
      } else if (authConfig) {
        if (authConfig.defaultAuthentication.authenticationType === 'API_KEY') {
          hasApiKey = true;
        } else if (
          authConfig.additionalAuthenticationProviders &&
          authConfig.additionalAuthenticationProviders.find(p => p.authenticationType === 'API_KEY')
        ) {
          hasApiKey = true;
        }
      }
    }

    return hasApiKey;
  };

  const writeUpdatedParametersJson = (resource, rootKey) => {
    const { category, resourceName } = resource;
    // Read parameters.json, add timestamps, and write to build/parameters.json
    const parametersFilePath = path.join(backEndDir, category, resourceName, PARAM_FILE_NAME);
    const currentParameters = defaultParams || {};
    const apiKeyConfigured = getApiKeyConfigured();
    currentParameters.CreateAPIKey = apiKeyConfigured ? 1 : 0;
    if (fs.existsSync(parametersFilePath)) {
      try {
        const paramFile = fs.readFileSync(parametersFilePath).toString();
        const personalParams = JSON.parse(paramFile);
        Object.assign(currentParameters, personalParams);

        // If authRoleName parameter not present, add it
        if (!currentParameters.authRoleName) {
          currentParameters.authRoleName = {
            Ref: 'AuthRoleName',
          };
        }

        // If unauthRoleName parameter not present, add it
        if (!currentParameters.unauthRoleName) {
          currentParameters.unauthRoleName = {
            Ref: 'UnauthRoleName',
          };
        }

        if (personalParams.CreateAPIKey !== undefined && personalParams.APIKeyExpirationEpoch !== undefined) {
          context.print.warning(
            'APIKeyExpirationEpoch and CreateAPIKey parameters should not used together because it can cause ' +
              'unwanted behavior. In the future APIKeyExpirationEpoch will be removed, use CreateAPIKey instead.',
          );
        }

        // If the customer explicitly disabled API Key creation via legacy setting, show a warning and
        // honor the setting.
        if (personalParams.APIKeyExpirationEpoch) {
          if (personalParams.APIKeyExpirationEpoch === -1) {
            currentParameters.CreateAPIKey = 0;

            delete currentParameters.APIKeyExpirationEpoch;

            context.print.warning(
              "APIKeyExpirationEpoch parameter's -1 value is deprecated to disable " +
                'the API Key creation. In the future CreateAPIKey parameter replaces this behavior.',
            );
          } else {
            currentParameters.CreateAPIKey = 1;
          }
        }

        // We've to honor if customers are setting CreateAPIKey to 0 in their parameters file
        // to preserve the same behavior if APIKeyExpirationEpoch would be -1, so if it
        // was defined then its already copied over to currentParameters and we'll not overwrite it
        // based on the security configuration.
        if (personalParams.CreateAPIKey === undefined) {
          currentParameters.CreateAPIKey = apiKeyConfigured ? 1 : 0;
        }
      } catch (e) {
        context.print.error(`Could not parse parameters file at "${parametersFilePath}"`);
      }
    }
    if (!useDeprecatedParameters) {
      Object.assign(currentParameters, {
        S3DeploymentBucket: projectBucket,
        S3DeploymentRootKey: rootKey,
      });
    }

    // As a safety mechanism when dealing with migrations and diff versions,
    // make sure only expected parameters are passed.
    const cfFilePath = path.join(backEndDir, category, resourceName, 'build', CF_FILE_NAME);
    try {
      const cfFileContents = fs.readFileSync(cfFilePath).toString();
      const cfTemplateJson = JSON.parse(cfFileContents);
      const paramKeys = Object.keys(currentParameters);
      for (let keyIndex = 0; keyIndex < paramKeys.length; keyIndex++) {
        const paramKey = paramKeys[keyIndex];
        if (!cfTemplateJson.Parameters[paramKey]) {
          delete currentParameters[paramKey];
        }
      }
    } catch (e) {
      context.print.warning(`Could not read cloudformation template at path: ${cfFilePath}`);
    }

    const jsonString = JSON.stringify(currentParameters, null, 4);
    const buildDirectoryPath = path.join(backEndDir, category, resourceName, 'build');
    const parametersOutputFilePath = path.join(buildDirectoryPath, PARAM_FILE_NAME);
    fsext.ensureDirSync(buildDirectoryPath);
    fs.writeFileSync(parametersOutputFilePath, jsonString, 'utf8');
  };

  // There can only be one appsync resource
  if (allApiResourceToUpdate.length > 0) {
    const resource = allApiResourceToUpdate[0];
    const { category, resourceName } = resource;
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const resourceBuildDir = path.normalize(path.join(resourceDir, 'build'));

    const deploymentRootKey = await getDeploymentRootKey(resourceDir);
    writeUpdatedParametersJson(resource, deploymentRootKey);

    // Upload build/* to S3.
    const s3Client = await new S3(context);
    if (!fs.existsSync(resourceBuildDir)) {
      return;
    }
    await TransformPackage.uploadAPIProject({
      directory: resourceBuildDir,
      upload: async blob => {
        const { Key, Body } = blob;
        const fullKey = `${deploymentRootKey}/${Key}`;

        return await s3Client.uploadFile({
          Key: fullKey,
          Body,
        });
      },
    });
  } else if (allApiResources.length > 0) {
    // We need to update the parameters file even when we are not deploying the API
    // category to fix a bug around deployments on CI/CD platforms. Basically if a
    // build has not run on this machine before and we are updating a non-api category,
    // the params will not have the S3DeploymentRootKey parameter and will fail.
    // This block uses the consistent hash to fill params so the push
    // succeeds when the api category has not been built on this machine.
    const resource = allApiResources[0];
    const { category, resourceName } = resource;
    const resourceDir = path.normalize(path.join(backEndDir, category, resourceName));
    const deploymentRootKey = await getDeploymentRootKey(resourceDir);
    writeUpdatedParametersJson(resource, deploymentRootKey);
  }
}

/**
 * Hashes the project directory into a single value. The same project configuration
 * should return the same hash.
 */
async function hashDirectory(directory) {
  const options = {
    encoding: 'hex',
    folders: {
      exclude: ['build'],
    },
  };

  const hashResult = await hashElement(directory, options);

  return hashResult.hash;
}

module.exports = {
  uploadAppSyncFiles,
  hashDirectory,
};
