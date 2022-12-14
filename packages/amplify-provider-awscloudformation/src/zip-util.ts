import { AmplifyFault } from 'amplify-cli-core';
import extract from 'extract-zip';
import fs from 'fs-extra';
import path from 'path';
import { S3 } from './aws-utils/aws-s3';
import { fileLogger } from './utils/aws-logger';

const logger = fileLogger('zip-util');

/**
 * Downloads a zip file from S3
 */
export const downloadZip = async (s3: S3, tempDir: string, zipFileName: string, envName: string): Promise<string> => {
  const log = logger('downloadZip.s3.getFile', [{ Key: zipFileName }, envName]);
  log();
  fs.ensureDirSync(tempDir);
  const tempFile = `${tempDir}/${zipFileName}`;
  await s3.downloadFile({ Key: zipFileName }, envName, tempFile);

  return tempFile;
};

/**
 * Extracts a zip file to a given directory
 */
export const extractZip = async (tempDir: string, zipFile: string): Promise<string> => {
  try {
    const fileNameExt = path.basename(zipFile);
    const filename = fileNameExt.split('.')[0];
    const unzippedDir = path.join(tempDir, filename);

    await extract(zipFile, { dir: unzippedDir });

    return unzippedDir;
  } catch (e) {
    throw new AmplifyFault('ZipExtractFault', {
      message: 'Failed to extract zip file: ',
      details: e.message,
    }, e);
  }
};
