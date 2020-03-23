import fs from 'fs-extra';
import path from 'path';
import _ from 'lodash'
import { PackageRequest, PackageResult } from 'amplify-function-plugin-interface/src';

export async function packageResource(request: PackageRequest, context: any): Promise<PackageResult> {
  if (!request.lastPackageTimestamp || request.lastBuildTimestamp > request.lastPackageTimestamp) {
    const packageHash = (await context.amplify.hashDir(path.join(request.srcRoot, 'src'), ['build'])) as string;
    const output = fs.createWriteStream(request.dstFilename);

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({ packageHash });
      });
      output.on('error', err => {
        reject(new Error(`Failed to copy zip with error: [${err}]`));
      });
      let zipFile : string = String(_.split(request.srcRoot,'/').pop())+ '.zip'
      fs.createReadStream(path.join(request.srcRoot, 'build','distributions',zipFile)).pipe(output);
    });
  }
  return Promise.resolve({});
}
