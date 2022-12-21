/* eslint-disable max-depth */
/* eslint-disable max-lines-per-function */
/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable max-len */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable func-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-arrow/prefer-arrow-functions */
import {
  $TSContext, $TSMeta, JSONUtilities, PathConstants, stateManager,
} from 'amplify-cli-core';
import fs from 'fs-extra';
import glob from 'glob';
import _ from 'lodash';
import path from 'path';
import Cloudformation from './aws-utils/aws-cfn';
import { S3 } from './aws-utils/aws-s3';
import { buildOverridesEnabledResources } from './build-override-enabled-resources';
import { S3BackendZipFileName } from './constants';
import { fileLogger } from './utils/aws-logger';
import { downloadZip, extractZip } from './zip-util';

const logger = fileLogger('initialize-env');

/**
 * initialize env for selected provider
 */
export async function run(context: $TSContext, providerMetadata: $TSMeta) {
  if (!(context.exeInfo && context.exeInfo.isNewEnv)) {
    const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
    const tempDir = path.join(amplifyDir, '.temp');
    const currentCloudBackendDir = context.amplify.pathManager.getCurrentCloudBackendDirPath();
    const backendDir = context.amplify.pathManager.getBackendDirPath();

    const s3 = await S3.getInstance(context);
    const cfnItem = await new Cloudformation(context);
    const file = await downloadZip(s3, tempDir, S3BackendZipFileName, undefined);
    const unzippedDir = await extractZip(tempDir, file);

    fs.removeSync(currentCloudBackendDir);

    // Move out cli.*json if exists in the temp directory into the amplify directory before copying backend and
    // current cloud backend directories.
    const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
      cwd: unzippedDir,
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

    fs.copySync(unzippedDir, currentCloudBackendDir);
    if (context.exeInfo.restoreBackend) {
      fs.removeSync(backendDir);
      fs.copySync(unzippedDir, backendDir);
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
  }
  await buildOverridesEnabledResources(context);
  return context;
}
