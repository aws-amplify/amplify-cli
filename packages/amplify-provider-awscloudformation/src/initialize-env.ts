import { $TSContext, $TSMeta, AmplifyError, JSONUtilities, PathConstants, stateManager } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import { globSync } from 'glob';
import _ from 'lodash';
import path from 'path';
import { Readable } from 'stream';
import Cloudformation from './aws-utils/aws-cfn';
import { S3 } from './aws-utils/aws-s3';
import { buildOverridesEnabledResources } from './build-override-enabled-resources';
import { S3BackendZipFileName } from './constants';
import { fileLogger } from './utils/aws-logger';
import { downloadZip, extractZip } from './zip-util';
import { generateDependentResourcesType } from '@aws-amplify/amplify-category-custom';
import { text } from 'node:stream/consumers';

const logger = fileLogger('initialize-env');

// const streamToString = async (stream: Readable) => {
//   const chunks = [];
//   for await (const chunk of stream) {
//     chunks.push(Buffer.from(chunk));
//   }
//   return Buffer.concat(chunks).toString('utf-8');
// };

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
    let currentCloudBackendZip: string;
    try {
      currentCloudBackendZip = await downloadZip(s3, tempDir, S3BackendZipFileName, undefined);
    } catch (err) {
      if (err?.name === 'NoSuchBucket') {
        throw new AmplifyError('EnvironmentNotInitializedError', {
          message: `Could not find a deployment bucket for the specified backend environment. This environment may have been deleted.`,
          resolution: 'Make sure the environment has been initialized with "amplify init" or "amplify env add".',
        });
      }
      // if there was some other error, rethrow it
      throw err;
    }

    const unzippedDir = await extractZip(tempDir, currentCloudBackendZip);

    fs.removeSync(currentCloudBackendDir);

    // Move out cli.*json if exists in the temp directory into the amplify directory before copying backend and
    // current cloud backend directories.
    const cliJSONFiles = globSync(PathConstants.CLIJSONFileNameGlob, {
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
    const cfnItem = await new Cloudformation(context);
    await cfnItem.updateamplifyMetaFileWithStackOutputs(providerMetadata.StackName);

    // Copy provider metadata from current-cloud-backend/amplify-meta to backend/amplify-meta
    const currentAmplifyMeta = stateManager.getCurrentMeta();
    const amplifyMeta = stateManager.getMeta();

    // Copy providerMetadata for each resource - from what is there in the cloud

    Object.keys(amplifyMeta).forEach((category) => {
      Object.keys(amplifyMeta[category]).forEach((resource) => {
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
    // convert output of getFile from stream to string for parsing
    const s3FileStream = await s3.getFile({
      Key: PathConstants.AmplifyMetaFileName,
    });
    const s3FileString = await text(s3FileStream as Readable);
    const s3AmplifyMeta = JSONUtilities.parse(s3FileString);

    Object.keys(s3AmplifyMeta)
      .filter((k) => k !== 'providers')
      .forEach((category) => {
        Object.keys(s3AmplifyMeta[category]).forEach((resourceName) => {
          const resource = s3AmplifyMeta[category][resourceName];

          // Mobile hub migrated resources does not have an assigned provider
          if (resource.mobileHubMigrated === true) {
            _.setWith(amplifyMeta, [category, resourceName], resource);
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
  await generateDependentResourcesType();
  return context;
}
