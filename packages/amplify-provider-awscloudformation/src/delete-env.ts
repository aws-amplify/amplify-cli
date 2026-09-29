import * as fs from 'fs-extra';
import * as path from 'path';
import { stateManager } from '@aws-amplify/amplify-cli-core';
import { loadConfigurationForEnv } from './configuration-manager';
import Cloudformation from './aws-utils/aws-cfn';
import { S3 } from './aws-utils/aws-s3';
import { deleteEnv } from './amplify-service-manager';
import { S3BackendZipFileName, ProviderName } from './constants';
import { downloadZip, extractZip } from './zip-util';

/**
 * Entry point for removing an environment
 */
export const run = async (context, envName, deleteS3): Promise<void> => {
  const credentials = await loadConfigurationForEnv(context, envName);
  const cfn = await new Cloudformation(context, null, credentials);
  const s3 = await S3.getInstance(context, credentials);
  let removeBucket = false;
  let deploymentBucketName;
  let storageCategoryBucketName;

  if (deleteS3) {
    deploymentBucketName = stateManager.getTeamProviderInfo()?.[envName]?.[ProviderName]?.DeploymentBucketName;
    if (await s3.ifBucketExists(deploymentBucketName)) {
      const amplifyDir = context.amplify.pathManager.getAmplifyDirPath();
      const tempDir = path.join(amplifyDir, envName, '.temp');
      storageCategoryBucketName = await getStorageCategoryBucketNameFromCloud(context, envName, s3, tempDir);

      fs.removeSync(tempDir);

      if (storageCategoryBucketName) {
        await s3.emptyS3Bucket(storageCategoryBucketName);
      }

      removeBucket = true;
    } else {
      context.print.info(
        `Unable to remove env: ${envName} because deployment bucket ${deploymentBucketName} does not exist or has been deleted.`,
      );
    }
  }

  await cfn.deleteResourceStack(envName);

  // In case the S3 bucket is retained and removal skipped by CF, then we explicitly delete it.
  if (storageCategoryBucketName) {
    await s3.deleteS3Bucket(storageCategoryBucketName);
  }

  await deleteEnv(context, envName);

  if (removeBucket && deploymentBucketName) {
    await s3.deleteS3Bucket(deploymentBucketName);
  }
};

const getStorageCategoryBucketNameFromCloud = async (context, envName, s3, tempDir): Promise<string | undefined> => {
  const sourceZipFile = await downloadZip(s3, tempDir, S3BackendZipFileName, envName);
  const unZippedDir = await extractZip(tempDir, sourceZipFile);
  const amplifyMeta = context.amplify.readJsonFile(`${unZippedDir}/amplify-meta.json`);
  const storage = amplifyMeta.storage || {};

  // filter out imported buckets as we cannot touch those.
  const s3Storage = Object.keys(storage).filter((r) => storage[r].service === 'S3' && storage[r].serviceType !== 'imported');

  if (!s3Storage.length) {
    return undefined;
  }

  const fStorageName = s3Storage[0];

  return storage[fStorageName].output.BucketName;
};
