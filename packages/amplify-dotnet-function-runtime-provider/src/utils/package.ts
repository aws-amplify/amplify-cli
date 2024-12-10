import fs from 'fs-extra';
import path from 'path';
import * as execa from 'execa';
import { PackageRequest, PackageResult } from '@aws-amplify/amplify-function-plugin-interface';
import { executableName } from '../constants';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

export const packageAssemblies = async (request: PackageRequest, context: any): Promise<PackageResult> => {
  const distPath = path.join(request.srcRoot, 'dist');
  const sourcePath = path.join(request.srcRoot, 'src');

  if (fs.existsSync(request.dstFilename)) {
    fs.removeSync(request.dstFilename);
  }

  const packageHash = (await context.amplify.hashDir(distPath, [])) as string;
  const framework = 'net8.0';
  try {
    const result = execa.sync(
      executableName,
      ['lambda', 'package', '--framework', framework, '--configuration', 'Release', '--output-package', request.dstFilename],
      {
        cwd: sourcePath,
      },
    );

    if (result.exitCode !== 0) {
      throw new Error(`Packaging failed. Exit code was ${result.exitCode}`);
    }
  } catch (err) {
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `Packaging failed, error message was ${err.message}` }, err);
  }

  return {
    packageHash: packageHash,
  };
};
