import { CheckDependenciesResult, PackageRequest, PackageResult, BuildRequest, BuildResult } from 'amplify-function-plugin-interface/src';
import * as which from 'which';
import * as execa from 'execa';
import archiver from 'archiver';
import fs from 'fs-extra';
import glob from 'glob';
import path from 'path';
import { SemVer, coerce, gte, lt } from 'semver';
import { BIN_LOCAL, BIN, SRC, MAIN_BINARY, DIST, MAIN_SOURCE, MAIN_BINARY_WIN } from './constants';

const executableName = 'go';
const minimumVersion = <SemVer>coerce('1.0');
const maximumVersion = <SemVer>coerce('2.0');

let executablePath: string | null;

export const executeCommand = (
  args: string[],
  streamStdio: boolean,
  env: {} = {},
  cwd: string | undefined = undefined,
  stdioInput: string | undefined = undefined,
): string => {
  const output = execa.sync(executableName, args, {
    stdio: streamStdio === true ? 'inherit' : 'pipe',
    env,
    cwd,
    input: stdioInput,
  });

  if (output.exitCode !== 0) {
    throw new Error(`${executableName} failed, exit code was ${output.exitCode}`);
  }

  return output.stdout;
};

const isBuildStale = (resourceDir: string, lastBuildTimestamp: Date, outDir: string) => {
  // If output directory does not exists or empty, rebuild required
  if (!fs.existsSync(outDir) || glob.sync(`${outDir}/**`).length == 0) {
    return true;
  }

  // If the timestamp of the src directory is newer than last build, rebuild required
  const srcDir = path.join(resourceDir, SRC);
  const dirTime = new Date(fs.statSync(srcDir).mtime);

  if (dirTime > lastBuildTimestamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = glob
    .sync(`${resourceDir}/${SRC}/**`)
    .find(file => new Date(fs.statSync(file).mtime) > lastBuildTimestamp);

  return !!fileUpdatedAfterLastBuild;
};

export const buildResourceInternal = async (
  request: BuildRequest,
  context: any,
  force: boolean,
  forLocalInvoke: boolean,
): Promise<BuildResult> => {
  let rebuilt = false;

  const buildDir = forLocalInvoke === true ? BIN_LOCAL : BIN;
  const outDir = path.join(request.srcRoot, buildDir);

  const isWindows = /^win/.test(process.platform);
  const executableName = isWindows === true ? MAIN_BINARY_WIN : MAIN_BINARY;
  const executablePath = path.join(outDir, executableName);

  // For local invoke we've to use the build timestamp of the binary built
  let timestampToCheck;

  if (forLocalInvoke === true) {
    if (fs.existsSync(executablePath)) {
      timestampToCheck = new Date(fs.statSync(executablePath).mtime);
    }
  } else {
    timestampToCheck = request.lastBuildTimestamp;
  }

  if (force === true || !timestampToCheck || isBuildStale(request.srcRoot, timestampToCheck, outDir)) {
    const srcDir = path.join(request.srcRoot, SRC);
    const entryFile = MAIN_SOURCE;

    // Clean and/or create the output directory
    if (fs.existsSync(outDir)) {
      fs.emptyDirSync(outDir);
    } else {
      fs.mkdirSync(outDir);
    }

    const envVars: any = {};

    if (forLocalInvoke === false) {
      envVars.GOOS = 'linux';
      envVars.GOARCH = 'amd64';
    }

    if (isWindows) {
      envVars.CGO_ENABLED = 0;
    }

    // Execute the build command, cwd must be the source file directory (Windows requires it)
    executeCommand(['build', '-o', executablePath, entryFile], true, envVars, srcDir);

    rebuilt = true;
  }

  return {
    rebuilt,
  };
};

export const checkDependencies = async (_runtimeValue: string): Promise<CheckDependenciesResult> => {
  // Check if go is in the path
  executablePath = which.sync(executableName, {
    nothrow: true,
  });

  if (executablePath === null) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `${executableName} executable was not found in PATH, make sure it's available. It can be installed from https://golang.org/doc/install`,
    };
  }

  // Validate go version
  const versionOutput = executeCommand(['version'], false);

  if (versionOutput) {
    const parts = versionOutput.split(' ');

    // Output: go version go1.14 darwin/amd64
    if (parts.length !== 4 || !parts[2].startsWith('go') || coerce(parts[2].slice(2)) === null) {
      return {
        hasRequiredDependencies: false,
        errorMessage: `Invalid version string: ${versionOutput}`,
      };
    }

    const version = <SemVer>coerce(parts[2].slice(2));

    if (lt(version, minimumVersion) || gte(version, maximumVersion)) {
      return {
        hasRequiredDependencies: false,
        errorMessage: `${executableName} version found was: ${version.format()}, but must be between ${minimumVersion.format()} and ${maximumVersion.format()}`,
      };
    }
  }

  return {
    hasRequiredDependencies: true,
  };
};

export const buildResource = async (request: BuildRequest, context: any): Promise<BuildResult> =>
  buildResourceInternal(request, context, false, false);

export const packageResource = async (request: PackageRequest, context: any): Promise<PackageResult> => {
  if (!request.lastPackageTimestamp || request.lastBuildTimestamp > request.lastPackageTimestamp) {
    const outDir = path.join(request.srcRoot, BIN);
    const mainFile = path.join(outDir, MAIN_BINARY);

    // zip source and dependencies and write to specified file
    const file = fs.createWriteStream(request.dstFilename);
    const packageHash = await context.amplify.hashDir(request.srcRoot, [DIST]);

    return new Promise(async (resolve, reject) => {
      file.on('close', () => {
        resolve({ packageHash });
      });

      file.on('error', err => {
        reject(new Error(`Failed to zip with error: [${err}]`));
      });

      const zip = archiver.create('zip', {});
      zip.pipe(file);

      // Add the main file and make sure to set 755 as mode so it will be runnable by Lambda
      zip.file(mainFile, {
        name: MAIN_BINARY,
        mode: 755,
      });

      // Add every other files in the out directory
      zip.glob('**/*', {
        cwd: outDir,
        ignore: [mainFile],
      });

      zip.finalize();
    });
  }

  return Promise.resolve({});
};
