import { PackageRequest, PackageResult } from 'amplify-function-plugin-interface';
import { executeCommand } from './helpers';
import * as fs from 'fs-extra';
import * as path from 'path';

// packageResource attempts to cross-compile a Swift project for Amazon Linux 2 and create a .zip file with everything necessary to
// facilitate a Swift runtime environment on Lambda. The swift-lambda cross-compilation tool takes care of all of this for us: it compiles a
// binary and bundles everything up into a .zip file all on its own.
export const packageResource = async (request: PackageRequest, context: any): Promise<PackageResult> => {
  if (!request.lastPackageTimestamp || request.lastBuildTimestamp > request.lastPackageTimestamp) {
    const packageHash = (await context.amplify.hashDir(path.join(request.srcRoot, 'Sources', 'example'), ['Package.swift'])) as string;
    const projectPath = path.join(request.srcRoot);

    // Attempt to build a .zip file with everything necessary for a custom bootstrap for Lambda.
    executeCommand('swift', ['lambda', 'build'], projectPath);
    // Move the produced .zip file to the location where the CLI expects it to be.
    fs.copySync(path.join(request.srcRoot, '.build', 'lambda', 'example.zip'), path.join(request.srcRoot, 'dist', 'latest-build.zip'));

    return { packageHash };
  }

  return {};
};
