import os from 'node:os';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Stream } from 'node:stream';

import unzipper from 'unzipper';
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { fileOrDirectoryExists } from './file-exists';

/**
 * Downloads and caches the current cloud backend from S3.
 */
export class BackendDownloader {
  private static ccbDir: string | undefined;
  private static readonly CURRENT_CLOUD_BACKEND = 'current-cloud-backend';

  constructor(private readonly s3Client: S3Client) {}

  private async makeTempDirectory(): Promise<string> {
    const tmpDir = os.tmpdir();
    const { sep } = path;
    return fs.mkdtemp(`${tmpDir}${sep}`);
  }

  public async getCurrentCloudBackend(bucket: string): Promise<string> {
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
    if (!response.Body) {
      throw new Error('S3 GetObject response body is empty');
    }
    await fs.writeFile(ccbZipPath, response.Body as Stream);
    if (!(await fileOrDirectoryExists(ccbZipPath))) {
      throw new Error(`${ccbZipPath} does not exist after download`);
    }
    const directory = await unzipper.Open.file(ccbZipPath);
    await directory.extract({
      path: path.join(tmpDir, BackendDownloader.CURRENT_CLOUD_BACKEND),
    });
    const ccbDir = path.join(tmpDir, BackendDownloader.CURRENT_CLOUD_BACKEND);
    BackendDownloader.ccbDir = ccbDir;
    return ccbDir;
  }
}
