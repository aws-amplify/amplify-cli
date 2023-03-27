import fs from 'fs-extra';
import path from 'path';
import { PackageRequest, PackageResult } from '@aws-amplify/amplify-function-plugin-interface';
import { AmplifyError } from 'amplify-cli-core';

export async function packageResource(request: PackageRequest, context: any): Promise<PackageResult> {
  if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp) {
    const packageHash = (await context.amplify.hashDir(path.join(request.srcRoot, 'src'), ['build'])) as string;
    const output = fs.createWriteStream(request.dstFilename);

    return new Promise((resolve, reject) => {
      output.on('close', () => {
        resolve({ packageHash });
      });
      output.on('error', (err) => {
        reject(new AmplifyError('PackagingLambdaFunctionError', { message: `Failed to copy zip with error: [${err}]` }, err));
      });
      // build through gradle build
      const zipFile = 'latest_build.zip';
      fs.createReadStream(path.join(request.srcRoot, 'build', 'distributions', zipFile)).pipe(output);
    });
  }
  return Promise.resolve({});
}
