import { AmplifyFault, extract } from '@aws-amplify/amplify-cli-core';
import fs from 'fs-extra';
import path from 'path';
import { Readable } from 'stream';
import { S3 } from './aws-utils/aws-s3';
import { fileLogger } from './utils/aws-logger';

const logger = fileLogger('zip-util');

const streamToBuffer = async (stream: Readable): Promise<Buffer> => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
};

/**
 * Downloads a zip file from S3
 */
export const downloadZip = async (s3: S3, tempDir: string, zipFileName: string, envName: string): Promise<string> => {
  const log = logger('downloadZip.s3.getFile', [{ Key: zipFileName }, envName]);
  log();
  const objectResult = await s3.getFile({ Key: zipFileName }, envName);
  fs.ensureDirSync(tempDir);

  // After updating node types from 12.x to 18.x the objectResult
  // became not directly assignable to Buffer.from parameter type.
  // However, this code has been running fine since 2022 which means that
  // runtime types are compatible.
  // The alternative would require multiple logical branches to handle type mismatch
  // that doesn't seem to exist in runtime.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const buff = await streamToBuffer(objectResult as ReadableStream);
  const tempFile = `${tempDir}/${zipFileName}`;
  await fs.writeFile(tempFile, buff);

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
    throw new AmplifyFault(
      'ZipExtractFault',
      {
        message: 'Failed to extract zip file: ',
        details: e.message,
      },
      e,
    );
  }
};
