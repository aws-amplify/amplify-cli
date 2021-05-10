const fs = require('fs-extra');
const path = require('path');
const glob = require('glob');
const _ = require('lodash');
const Cloudformation = require('./aws-utils/aws-cfn');
const { S3 } = require('./aws-utils/aws-s3');
const { downloadZip, extractZip } = require('./zip-util');
const { S3BackendZipFileName } = require('./constants');
const { fileLogger } = require('./utils/aws-logger');
const logger = fileLogger('initialize-env');
import { JSONUtilities, PathConstants, stateManager, $TSMeta, $TSContext, pathManager } from 'amplify-cli-core';
import { ProviderName as providerName } from './constants';
import { rootStackExists } from './ensure-root-stack';

export async function run(context: $TSContext, providerMetadata: $TSMeta) {
  if (context.exeInfo && context.exeInfo.isNewEnv) {
    return context;
  }

  // empty #current-cloud-backend dir and reset default meta file
  resetCurrentCloudBackend();

  // if this environment is not pushed yet, early return
  if (!rootStackExists()) {
    return context;
  }

  const amplifyDir = pathManager.getAmplifyDirPath();
  const tempDir = path.join(amplifyDir, '.temp');
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
  const backendDir = pathManager.getBackendDirPath();

  const s3 = await S3.getInstance(context);
  const cfnItem = await new Cloudformation(context);
  const file = await downloadZip(s3, tempDir, S3BackendZipFileName);
  const unzippeddir = await extractZip(tempDir, file);

  // Move out cli.*json if exists in the temp directory into the amplify directory before copying backand and
  // current cloud backend directories.
  const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
    cwd: unzippeddir,
    absolute: true,
  });

  if (context.exeInfo.restoreBackend) {
    // If backend must be restored then copy out the config files and overwrite existing ones.
    for (const cliJSONFilePath of cliJSONFiles) {
      const targetPath = path.join(amplifyDir, path.basename(cliJSONFilePath));

      fs.moveSync(cliJSONFilePath, targetPath, { overwrite: true });
    }
  } else {
    // If backend is not being restored, just delete the config files in the current cloud backend if present
    for (const cliJSONFilePath of cliJSONFiles) {
      fs.removeSync(cliJSONFilePath);
    }
  }

  fs.copySync(unzippeddir, currentCloudBackendDir);
  if (context.exeInfo.restoreBackend) {
    fs.removeSync(backendDir);
    fs.copySync(unzippeddir, backendDir);
  }

  fs.removeSync(tempDir);

  logger('run.cfn.updateamplifyMetaFileWithStackOutputs', [{ StackName: providerMetadata.StackName }])();
  await cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName);

  // Copy provider metadata from current-cloud-backend/amplify-meta to backend/ampliy-meta
  const currentAmplifyMeta = stateManager.getCurrentMeta();
  const amplifyMeta = stateManager.getMeta();

  // Copy providerMetadata for each resource - from what is there in the cloud

  Object.keys(amplifyMeta).forEach(category => {
    Object.keys(amplifyMeta[category]).forEach(resource => {
      if (currentAmplifyMeta[category] && currentAmplifyMeta[category][resource]) {
        amplifyMeta[category][resource].providerMetadata = currentAmplifyMeta[category][resource].providerMetadata;
      }
    });
  });

  //
  // Download the meta file from the bucket and see if it has migrated resources (mobileHubMigrated property === true)
  // copy those over to the reconstructed meta file.
  //

  let hasMigratedResources = false;
  const s3AmplifyMeta = JSONUtilities.parse(
    (
      await s3.getFile({
        Key: PathConstants.AmplifyMetaFileName,
      })
    ).toString(),
  );

  Object.keys(s3AmplifyMeta)
    .filter(k => k !== 'providers')
    .forEach(category => {
      Object.keys(s3AmplifyMeta[category]).forEach(resourceName => {
        const resource = s3AmplifyMeta[category][resourceName];

        // Mobile hub migrated resources does not have an assigned provider
        if (resource.mobileHubMigrated === true) {
          _.set(amplifyMeta, [category, resourceName], resource);
          hasMigratedResources = true;
        }
      });
    });

  stateManager.setMeta(undefined, amplifyMeta);

  // If the project has any mobile hub migrated projects then to show no diff between
  // cloud and local env we have to copy the new meta to current cloud backend as well.
  if (hasMigratedResources) {
    stateManager.setCurrentMeta(undefined, amplifyMeta);
  }
  return context;
}

const resetCurrentCloudBackend = () => {
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();
  fs.removeSync(currentCloudBackendDir);
  fs.ensureDirSync(currentCloudBackendDir);
  stateManager.setCurrentMeta(undefined, {
    providers: {
      [providerName]: {},
    },
  });
};
