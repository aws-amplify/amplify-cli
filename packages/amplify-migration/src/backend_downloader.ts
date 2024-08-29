import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import assert from 'node:assert';
import { Stream } from 'node:stream';

import unzipper from 'unzipper';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { fileOrDirectoryExists } from './directory_exists';

export class BackendDownloader {
  constructor(private s3Client: S3Client) {}
  private static ccbDir: string | undefined;

  private static CURRENT_CLOUD_BACKEND = 'current-cloud-backend';
  private makeTempDirectory = async (): Promise<string> => {
    const tmpDir = os.tmpdir();
    const { sep } = path;
    return await fs.mkdtemp(`${tmpDir}${sep}`);
  };
  getCurrentCloudBackend = async (bucket: string): Promise<string> => {
    if (BackendDownloader.ccbDir && (await fileOrDirectoryExists(BackendDownloader.ccbDir))) {
      return BackendDownloader.ccbDir;
    }
    const tmpDir = await this.makeTempDirectory();
    const ccbZippedFilename = `#${BackendDownloader.CURRENT_CLOUD_BACKEND}.zip`;
    const ccbZipPath = path.join(tmpDir, ccbZippedFilename);
    const response = await this.s3Client.send(
      new GetObjectCommand({
        Key: ccbZippedFilename,
        Bucket: bucket,
      }),
    );
    assert(response.Body, 'Body is empty');
    await fs.writeFile(ccbZipPath, response.Body as Stream);
    assert(await fileOrDirectoryExists(ccbZipPath), `${ccbZipPath} does not exist.`);
    const directory = await unzipper.Open.file(ccbZipPath);
    await directory.extract({
      path: path.join(tmpDir, BackendDownloader.CURRENT_CLOUD_BACKEND),
    });
    const ccbDir = path.join(tmpDir, BackendDownloader.CURRENT_CLOUD_BACKEND);
    BackendDownloader.ccbDir = ccbDir;
    return ccbDir;
  };
}
