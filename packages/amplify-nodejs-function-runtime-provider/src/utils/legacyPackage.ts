import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';
import { PackageRequest, PackageResult } from 'amplify-function-plugin-interface/src';

export async function packageResource(request: PackageRequest, context: any): Promise<PackageResult> {
  if (!request.lastPackageTimestamp || request.lastBuildTimestamp > request.lastPackageTimestamp) {
    const packageHash = (await context.amplify.hashDir(path.join(request.srcRoot, 'src'), ['node_modules'])) as string;
    const output = fs.createWriteStream(request.dstFilename);

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({ packageHash });
      });
      output.on('error', err => {
        reject(new Error(`Failed to zip with error: [${err}]`));
      });
      const zip = archiver.create('zip', {});
      zip.pipe(output);
      zip.directory(path.join(request.srcRoot, 'src'), false);
      zip.finalize();
    });
  }
  return Promise.resolve({});
}
