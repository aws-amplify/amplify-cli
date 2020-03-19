import {
  FunctionRuntimeContributorFactory,
  PackageRequest,
  BuildRequest,
  PackageResult,
  BuildResult,
  CheckDependenciesResult,
} from 'amplify-function-plugin-interface';
import { execAsStringPromise, getPipenvDir } from './util/buildUtils';
import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import { majMinPyVersion } from './util/buildUtils';

export const functionRuntimeContributorFactory: FunctionRuntimeContributorFactory = context => {
  return {
    contribute: request => {
      const selection = request.selection;
      if (selection !== 'python') {
        return Promise.reject(new Error(`Unknown selection ${selection}`));
      }
      return Promise.resolve({
        runtime: {
          name: 'Python',
          value: 'python',
          cloudTemplateValue: 'python3.8',
          defaultHandler: 'index.handler',
        },
      });
    },
    checkDependencies: checkDeps,
    package: params => pythonPackage(params, context),
    build: pythonBuild,
    invoke: params => {
      throw new Error('not yet implemented');
    },
  };
};

async function checkDeps(): Promise<CheckDependenciesResult> {
  return new Promise((resolve, reject) => {
    Promise.all([execAsStringPromise('python3 --version'), execAsStringPromise('pipenv --version')]).then(versions => {
      let hasDeps = true;
      let errorMessage = '';
      if (!versions[0] || parseFloat(majMinPyVersion(versions[0])) < 3.8) {
        hasDeps = false;
        errorMessage =
          'You must have python >= 3.8 installed and available on your PATH as "python3". It can be installed at https://www.python.org/downloads';
      }
      if (!versions[1]) {
        hasDeps = false;
        let message =
          'You must have pipenv installed and available on your PATH as "pipenv". It can be installed by running "pip install pipenv".';
        errorMessage = errorMessage.concat(errorMessage ? '\n' : '', message);
      }
      resolve({
        hasRequiredDependencies: hasDeps,
        errorMessage,
      });
    });
  });
}

// packages python lambda functions and writes the archive to the specified file
async function pythonPackage(params: PackageRequest, context: any): Promise<PackageResult> {
  if (!params.lastPackageTimestamp || params.lastBuildTimestamp > params.lastPackageTimestamp) {
    // zip source and dependencies and write to specified file
    const file = fs.createWriteStream(params.dstFilename);
    const packageHash = await context.amplify.hashDir(params.srcRoot, ['dist']);
    return new Promise(async (resolve, reject) => {
      file.on('close', () => {
        resolve({ packageHash });
      });
      file.on('error', err => {
        reject(new Error(`Failed to zip with error: [${err}]`));
      });
      const zip = archiver.create('zip', {});
      zip.pipe(file);
      zip.glob('**/*', {
        cwd: params.srcRoot,
        ignore: ['dist/**'],
      });
      zip.directory(await getPipenvDir(params.srcRoot), false);
      zip.finalize();
    });
  }
  return Promise.resolve({});
}

async function pythonBuild(params: BuildRequest): Promise<BuildResult> {
  if (!params.lastBuildTimestamp || isBuildStale(params.srcRoot, params.lastBuildTimestamp)) {
    await execAsStringPromise('pipenv install', { cwd: params.srcRoot }, undefined, true);
    return Promise.resolve({ rebuilt: true });
  }
  return Promise.resolve({ rebuilt: false });
}

function isBuildStale(resourceDir: string, lastBuildTimestamp: Date) {
  const dirTime = new Date(fs.statSync(resourceDir).mtime);
  if (dirTime > lastBuildTimestamp) {
    return true;
  }
  const fileUpdatedAfterLastBuild = glob.sync(`${resourceDir}/**`).find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);
  return !!fileUpdatedAfterLastBuild;
}
