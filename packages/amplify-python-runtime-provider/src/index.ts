import { FunctionRuntimeContributorFactory, PackageRequest, BuildRequest } from 'amplify-function-plugin-interface';
import { execAsStringPromise, getPipenvDir } from './util/buildUtils';
import archiver from 'archiver';
import fs from 'fs-extra';
import path from 'path';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: selection => {
      if (selection !== 'python') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'python',
          value: 'python3.8',
          defaultHandler: 'index.handler',
        },
      });
    },
    package: pythonPackage,
    build: pythonBuild,
    invoke: params => {
      throw new Error('not yet implemented');
    },
  };
};

// packages python lambda functions and writes the archive to params.dstStream
async function pythonPackage(params: PackageRequest): Promise<void> {
  // do fresh build
  await pythonBuild(params);

  // zip source and dependencies and write to specified file
  const zip = archiver.create('zip', {});
  const file = fs.createWriteStream(params.dstFilename);
  zip.pipe(file);
  zip.directory(params.srcRoot, false);
  zip.directory(await getPipenvDir(params.srcRoot), false);
  await zip.finalize();
}

async function pythonBuild(params: BuildRequest): Promise<void> {
  if (fs.existsSync(path.join(params.srcRoot, buildScript))) {
    await execAsStringPromise(`./${buildScript}`, { cwd: params.srcRoot });
  }
  await execAsStringPromise('pipenv install', { cwd: params.srcRoot });
}
