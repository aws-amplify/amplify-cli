/* eslint-disable spellcheck/spell-checker */
/* eslint-disable import/no-extraneous-dependencies */
import { saveAll as saveAllEnvParams } from '@aws-amplify/amplify-environment-parameters';
import { buildTypeKeyMap, ServiceName } from '@aws-amplify/amplify-category-function';
import { $TSAny, $TSMeta, $TSObject, JSONUtilities, pathManager, ResourceTuple, stateManager } from '@aws-amplify/amplify-cli-core';
import { BuildType } from '@aws-amplify/amplify-function-plugin-interface';
import * as fs from 'fs-extra';
import _ from 'lodash';
import * as path from 'path';
import { ensureAmplifyMetaFrontendConfig } from './on-category-outputs-change';
import { getHashForResourceDir } from './resource-status';
import { updateBackendConfigAfterResourceAdd, updateBackendConfigAfterResourceUpdate } from './update-backend-config';

/**
 * Generic resource function to update any arbitrary value in amplify-meta.json and save.
 * @param filePath Path to amplify-meta.json
 * @param category Category to be updated in amplify-meta.json
 * @param resourceName Logical name of the resource in this category
 * @param attribute Attribute specific to the resource (cannot be nested)
 * @param value value for the above attribute
 * @param timestamp Timestamp at which value was updated
 * @returns amplifyMeta update
 */
export const updateAwsMetaFile = (
  filePath: string,
  category: string,
  resourceName: string,
  attribute: $TSAny,
  value: $TSAny,
  timestamp: $TSAny,
): $TSMeta => {
  const amplifyMeta = JSONUtilities.readJson<$TSMeta>(filePath);

  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
    amplifyMeta[category][resourceName] = {};
  } else if (!amplifyMeta[category][resourceName]) {
    amplifyMeta[category][resourceName] = {};
  }
  if (!amplifyMeta[category][resourceName][attribute]) {
    amplifyMeta[category][resourceName][attribute] = {};
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (!amplifyMeta[category][resourceName][attribute]) {
      amplifyMeta[category][resourceName][attribute] = {};
    }
    Object.assign(amplifyMeta[category][resourceName][attribute], value);
  } else {
    amplifyMeta[category][resourceName][attribute] = value;
  }
  if (timestamp) {
    amplifyMeta[category][resourceName].lastPushTimeStamp = timestamp;
  }

  JSONUtilities.writeJson(filePath, amplifyMeta);

  return amplifyMeta;
};

const moveBackendResourcesToCurrentCloudBackend = (resources: $TSObject[]): void => {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const amplifyCloudMetaFilePath = pathManager.getCurrentAmplifyMetaFilePath();
  const backendConfigFilePath = pathManager.getBackendConfigFilePath();
  const backendConfigCloudFilePath = pathManager.getCurrentBackendConfigFilePath();
  const overridePackageJsonBackendFilePath = path.join(pathManager.getBackendDirPath(), 'package.json');
  const overrideTsConfigJsonBackendFilePath = path.join(pathManager.getBackendDirPath(), 'tsconfig.json');
  const overridePackageJsonCurrentCloudBackendFilePath = path.join(pathManager.getCurrentCloudBackendDirPath(), 'package.json');
  const overrideTsConfigJsonCurrentCloudBackendFilePath = path.join(pathManager.getCurrentCloudBackendDirPath(), 'tsconfig.json');

  for (const resource of resources) {
    const sourceDir = path.normalize(path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName));
    const targetDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), resource.category, resource.resourceName));

    if (fs.pathExistsSync(targetDir)) {
      fs.removeSync(targetDir);
    }

    fs.ensureDirSync(targetDir);
    const isLambdaOrCustom =
      resource?.service === ServiceName.LambdaFunction || (resource?.service && resource?.service.includes('custom'));

    // in the case that the resource is being deleted, the sourceDir won't exist
    if (fs.pathExistsSync(sourceDir)) {
      const nodeModulesFilterFn = (src: string): boolean => path.basename(src) !== 'node_modules';
      fs.copySync(sourceDir, targetDir, { ...(isLambdaOrCustom ? { filter: nodeModulesFilterFn } : {}) });
    }
  }

  fs.copySync(amplifyMetaFilePath, amplifyCloudMetaFilePath, { overwrite: true });
  fs.copySync(backendConfigFilePath, backendConfigCloudFilePath, { overwrite: true });
  /**
   * copying package.json and tsconfig.json to current cloud backend
   */
  try {
    fs.writeFileSync(overridePackageJsonCurrentCloudBackendFilePath, fs.readFileSync(overridePackageJsonBackendFilePath));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }

  try {
    fs.writeFileSync(overrideTsConfigJsonCurrentCloudBackendFilePath, fs.readFileSync(overrideTsConfigJsonBackendFilePath));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      throw err;
    }
  }
};

/**
 * Update amplify-meta.json and backend-config.json
 */
export const updateamplifyMetaAfterResourceAdd = (
  category: string,
  resourceName: string,
  metadataResource: { dependsOn?: [{ category: string; resourceName: string }] } = {},
  backendConfigResource?: { dependsOn?: $TSAny },
  overwriteObjectIfExists?: boolean,
): void => {
  const amplifyMeta = stateManager.getMeta();

  if (metadataResource.dependsOn) {
    checkForCyclicDependencies(category, resourceName, metadataResource.dependsOn);
  }

  if (!amplifyMeta[category]) {
    amplifyMeta[category] = {};
  }
  if (amplifyMeta[category][resourceName] && !overwriteObjectIfExists) {
    throw new Error(`${resourceName} is present in amplify-meta.json`);
  }
  amplifyMeta[category][resourceName] = {};
  amplifyMeta[category][resourceName] = metadataResource;

  stateManager.setMeta(undefined, amplifyMeta);
  ensureAmplifyMetaFrontendConfig(amplifyMeta);

  // If a backend config resource passed in store it, otherwise the same data as in meta
  // In case of imported resources the output block contains only the user selected values that
  // are needed for recreation of sensitive data like secrets and such.
  updateBackendConfigAfterResourceAdd(category, resourceName, backendConfigResource || metadataResource);
};

/**
 * Update the cloudformation part of amplify-meta.json
 */
export const updateProviderAmplifyMeta = (providerName: string, options: $TSObject): void => {
  const amplifyMeta = stateManager.getMeta();

  if (!amplifyMeta.providers) {
    amplifyMeta.providers = {};
    amplifyMeta.providers[providerName] = {};
  } else if (!amplifyMeta.providers[providerName]) {
    amplifyMeta.providers[providerName] = {};
  }

  Object.keys(options).forEach((key) => {
    amplifyMeta.providers[providerName][key] = options[key];
  });

  stateManager.setMeta(undefined, amplifyMeta);
};

/**
 *  Update AmplifyMeta and BackendConfig ( if the service depends on another service)
 * @param category amplify category to be updated
 * @param resourceName logical name of resource to be updated
 * @param attribute  attribute key for which the value has changed
 * @param value value of the attribute
 * @returns updated AmplifyMeta
 */
export const updateamplifyMetaAfterResourceUpdate = (category: string, resourceName: string, attribute: string, value: $TSAny): $TSMeta => {
  const amplifyMetaFilePath = pathManager.getAmplifyMetaFilePath();
  const currentTimestamp = new Date();

  if (attribute === 'dependsOn') {
    checkForCyclicDependencies(category, resourceName, value);
  }

  const updatedMeta = updateAwsMetaFile(amplifyMetaFilePath, category, resourceName, attribute, value, currentTimestamp);

  if (['dependsOn', 'service', 'frontendAuthConfig'].includes(attribute)) {
    updateBackendConfigAfterResourceUpdate(category, resourceName, attribute, value);
  }

  return updatedMeta;
};

/**
 * Updates amplify-meta with the following data and also uploads currentCloudBackend
 * a. Directory hash
 * b. Timestamp of last push
 * @param resources all resources from amplify-meta.json
 */
export const updateamplifyMetaAfterPush = async (resources: $TSObject[]): Promise<void> => {
  // ensure backend config is written before copying to current-cloud-backend
  await saveAllEnvParams();
  const amplifyMeta = stateManager.getMeta();
  const currentTimestamp = new Date();

  for (const resource of resources) {
    // Skip hash calculation for imported resources
    if (resource.serviceType !== 'imported') {
      const sourceDir = path.normalize(path.join(pathManager.getBackendDirPath(), resource.category, resource.resourceName));
      // skip hashing deleted resources
      if (fs.pathExistsSync(sourceDir)) {
        let hashDir: string | undefined;

        if (resource.category === 'hosting' && resource.service === 'ElasticContainer') {
          const {
            frontend,
            [frontend]: {
              config: { SourceDir },
            },
          } = stateManager.getProjectConfig();
          // build absolute path for Dockerfile and docker-compose.yaml
          const projectRootPath = pathManager.findProjectRoot();
          // eslint-disable-next-line max-depth
          if (projectRootPath) {
            const sourceAbsolutePath = path.join(projectRootPath, SourceDir);

            // Generate the hash for this file, cfn files are autogenerated based on Dockerfile and resource settings
            // Hash is generated by this files and not cfn files
            hashDir = await getHashForResourceDir(sourceAbsolutePath, ['Dockerfile', 'docker-compose.yaml', 'docker-compose.yml']);
          }
        } else if (resource.category === 'function' && resource.service === ServiceName.LambdaLayer) {
          // Layers does not require lastPushDirHash as they are hashed differently
        } else {
          // Every other resource type gets standard hashing
          hashDir = await getHashForResourceDir(sourceDir);
        }

        if (hashDir) {
          amplifyMeta[resource.category][resource.resourceName].lastPushDirHash = hashDir;
        }

        amplifyMeta[resource.category][resource.resourceName].lastPushTimeStamp = currentTimestamp;
      }
    }

    // If the operation was a remove-sync then for imported resources we cannot set timestamp
    // but those are still in the received array as this method is operation agnostic.
    if (resource.serviceType === 'imported' && amplifyMeta[resource.category] && amplifyMeta[resource.category][resource.resourceName]) {
      amplifyMeta[resource.category][resource.resourceName].lastPushTimeStamp = currentTimestamp;
    }
  }

  stateManager.setMeta(undefined, amplifyMeta);

  moveBackendResourcesToCurrentCloudBackend(resources);
};

/**
 * Update Amplify Meta with build information ( lastBuildType and timestamp)
 */
export const updateamplifyMetaAfterBuild = ({ category, resourceName }: ResourceTuple, buildType: BuildType = BuildType.PROD): void => {
  const amplifyMeta = stateManager.getMeta();
  _.setWith(amplifyMeta, [category, resourceName, buildTypeKeyMap[buildType]], new Date());
  _.setWith(amplifyMeta, [category, resourceName, 'lastBuildType'], buildType);
  stateManager.setMeta(undefined, amplifyMeta);
};

/**
 * Update Amplify Meta with packaging information ( lastPackageTimeStamp, distZipFilename, hash)
 */
export const updateAmplifyMetaAfterPackage = (
  { category, resourceName }: ResourceTuple,
  zipFilename: string,
  hash?: { resourceKey: string; hashValue: string },
): void => {
  const amplifyMeta = stateManager.getMeta();
  _.setWith(amplifyMeta, [category, resourceName, 'lastPackageTimeStamp'], new Date());
  _.setWith(amplifyMeta, [category, resourceName, 'distZipFilename'], zipFilename);
  if (hash) {
    _.setWith(amplifyMeta, [category, resourceName, hash.resourceKey], hash.hashValue);
  }
  stateManager.setMeta(undefined, amplifyMeta);
};

/**
 * After resource deletion,
 * a. We remove the resource from amplify-meta.json and save it.
 * b. We remove the resource folder.
 * @param category category of the resource
 * @param resourceName logical name of the resource
 */
export const updateamplifyMetaAfterResourceDelete = (category: string, resourceName: string): void => {
  const currentMeta = stateManager.getCurrentMeta();

  const resourceDir = path.normalize(path.join(pathManager.getCurrentCloudBackendDirPath(), category, resourceName));

  if (currentMeta[category] && currentMeta[category][resourceName] !== undefined) {
    delete currentMeta[category][resourceName];
  }

  stateManager.setCurrentMeta(undefined, currentMeta);

  fs.removeSync(resourceDir);
};

const checkForCyclicDependencies = (
  category: $TSAny,
  resourceName: string,
  dependsOn: [{ category: string; resourceName: string }],
): void => {
  const amplifyMeta = stateManager.getMeta();
  let cyclicDependency = false;

  if (dependsOn) {
    dependsOn.forEach((resource) => {
      if (resource.category === category && resource.resourceName === resourceName) {
        cyclicDependency = true;
      }
      if (amplifyMeta[resource.category] && amplifyMeta[resource.category][resource.resourceName]) {
        const dependsOnResourceDependency = amplifyMeta[resource.category][resource.resourceName].dependsOn;
        if (dependsOnResourceDependency) {
          dependsOnResourceDependency.forEach((dependsOnResource) => {
            if (dependsOnResource.category === category && dependsOnResource.resourceName === resourceName) {
              cyclicDependency = true;
            }
          });
        }
      }
    });
  }

  if (cyclicDependency) {
    throw new Error(`Cannot add ${resourceName} due to a cyclic dependency`);
  }
};
