import { $TSContext, AmplifyFault, PathConstants, pathManager } from '@aws-amplify/amplify-cli-core';
import { AmplifySpinner } from '@aws-amplify/amplify-prompts';
import * as fs from 'fs-extra';
import glob from 'glob';
import * as path from 'path';
import { S3 } from '../aws-utils/aws-s3';
import archiver from './archiver';
import { fileLogger } from './aws-logger';

const logger = fileLogger('upload-current-cloud-backend');

/**
 * Publish files that Amplify Studio depends on outside the zip file so that can read
 * without streaming from the zip.
 */
const uploadStudioBackendFiles = async (s3: S3, bucketName: string) => {
  const amplifyDirPath = pathManager.getAmplifyDirPath();
  const studioBackendDirName = 'studio-backend';
  // Delete the contents of the studio backend directory first
  await s3.deleteDirectory(bucketName, studioBackendDirName);
  // Create a list of file params to upload to the deployment bucket
  const uploadFileParams = [
    'cli.json',
    'amplify-meta.json',
    'backend-config.json',
    'schema.graphql',
    'transform.conf.json',
    'parameters.json',
  ]
    .flatMap((baseName) => glob.sync(`**/${baseName}`, { cwd: amplifyDirPath, ignore: ['**/node_modules/**'] }))
    .filter((filePath) => !filePath.startsWith('backend'))
    .map((filePath) => ({
      Body: fs.createReadStream(path.join(amplifyDirPath, filePath)),
      Key: path.join(studioBackendDirName, filePath.replace('#current-cloud-backend', '')),
    }));

  await Promise.all(uploadFileParams.map((params) => s3.uploadFile(params, false)));
};

/**
 * Upload files that Amplify Studio depends on
 */
export const storeCurrentCloudBackend = async (context: $TSContext) => {
  const zipFilename = '#current-cloud-backend.zip';
  const backendDir = pathManager.getBackendDirPath();
  const tempDir = path.join(backendDir, '.temp');
  const currentCloudBackendDir = pathManager.getCurrentCloudBackendDirPath();

  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  const spinner = new AmplifySpinner();
  try {
    spinner.start('Saving deployment state...');

    // handle tag file
    const tagFilePath = pathManager.getTagFilePath();
    const tagCloudFilePath = pathManager.getCurrentTagFilePath();
    if (fs.existsSync(tagFilePath)) {
      fs.copySync(tagFilePath, tagCloudFilePath, { overwrite: true });
    }

    const cliJSONFiles = glob.sync(PathConstants.CLIJSONFileNameGlob, {
      cwd: pathManager.getAmplifyDirPath(),
      absolute: true,
    });

    const zipFilePath = path.normalize(path.join(tempDir, zipFilename));
    const result = await archiver.run(currentCloudBackendDir, zipFilePath, undefined, cliJSONFiles);
    const s3Key = `${result.zipFilename}`;
    const s3 = await S3.getInstance(context);

    const s3Params = {
      Body: fs.createReadStream(result.zipFilePath),
      Key: s3Key,
    };

    logger('storeCurrentCloudBackend.s3.uploadFile', [{ Key: s3Key }])();
    const deploymentBucketName = await s3.uploadFile(s3Params);
    await uploadStudioBackendFiles(s3, deploymentBucketName);
    spinner.stop('Deployment state saved successfully.');
  } catch (e) {
    spinner.stop('Deployment state save failed.', false);
    throw new AmplifyFault(
      'DeploymentStateUploadFault',
      {
        message: e.message,
      },
      e,
    );
  } finally {
    fs.removeSync(tempDir);
  }
};
