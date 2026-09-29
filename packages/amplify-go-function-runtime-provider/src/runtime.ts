import {
  CheckDependenciesResult,
  PackageRequest,
  PackageResult,
  BuildRequest,
  BuildResult,
  BuildType,
} from '@aws-amplify/amplify-function-plugin-interface';
import * as which from 'which';
import execa from 'execa';
import archiver from 'archiver';
import fs from 'fs-extra';
import { globSync } from 'glob';
import path from 'path';
import { SemVer, coerce, gte, lt } from 'semver';
import { BIN_LOCAL, BIN, SRC, MAIN_BINARY, DIST, MAIN_BINARY_WIN } from './constants';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

const executableName = 'go';
const minimumVersion = <SemVer>coerce('1.0');
const maximumVersion = <SemVer>coerce('2.0');

let executablePath: string | null;

export const executeCommand = (
  args: string[],
  streamStdio: boolean,
  env: Record<string, string> = {},
  cwd: string | undefined = undefined,
  stdioInput: string | undefined = undefined,
): string => {
  try {
    const output = execa.sync(executableName, args, {
      stdio: streamStdio === true ? 'inherit' : 'pipe',
      env,
      cwd,
      input: stdioInput,
    });
    if (output.exitCode !== 0) {
      throw new AmplifyError('PackagingLambdaFunctionError', { message: `${executableName} failed, exit code was ${output.exitCode}` });
    }
    return output.stdout;
  } catch (err) {
    throw new AmplifyError('PackagingLambdaFunctionError', { message: `${executableName} failed, error message was ${err.message}` }, err);
  }
};

const isBuildStale = (resourceDir: string, lastBuildTimeStamp: Date, outDir: string) => {
  // If output directory does not exists or empty, rebuild required
  if (!fs.existsSync(outDir) || globSync(`${outDir}/**`).length == 0) {
    return true;
  }

  // If the timestamp of the src directory is newer than last build, rebuild required
  const srcDir = path.join(resourceDir, SRC);
  const dirTime = new Date(fs.statSync(srcDir).mtime);

  if (dirTime > lastBuildTimeStamp) {
    return true;
  }

  const fileUpdatedAfterLastBuild = globSync(`${resourceDir}/${SRC}/**`).find(
    (file) => new Date(fs.statSync(file).mtime) > lastBuildTimeStamp,
  );

  return !!fileUpdatedAfterLastBuild;
};

export const buildResource = async ({ buildType, srcRoot, lastBuildTimeStamp }: BuildRequest): Promise<BuildResult> => {
  let rebuilt = false;

  const buildDir = buildType === BuildType.DEV ? BIN_LOCAL : BIN;
  const outDir = path.join(srcRoot, buildDir);

  const isWindows = process.platform.startsWith('win');

  if (!lastBuildTimeStamp || isBuildStale(srcRoot, lastBuildTimeStamp, outDir)) {
    const srcDir = path.join(srcRoot, SRC);

    // Clean and/or create the output directory
    if (fs.existsSync(outDir)) {
      fs.emptyDirSync(outDir);
    } else {
      fs.mkdirSync(outDir);
    }

    const envVars: any = { GOPROXY: 'direct' };

    if (buildType === BuildType.PROD) {
      envVars.GOOS = 'linux';
      envVars.GOARCH = 'amd64';
    }

    if (isWindows) {
      envVars.CGO_ENABLED = 0;
      executeCommand(['install', 'github.com/aws/aws-lambda-go/cmd/build-lambda-zip@latest'], true, envVars, srcDir);
    }

    // for go@1.16, dependencies must be manually installed
    executeCommand(['mod', 'tidy', '-v'], true, envVars, srcDir);
    // Execute the build command, cwd must be the source file directory (Windows requires it)
    // Details: https://github.com/aws/aws-lambda-go
    executeCommand(['build', '-o', '../bin/bootstrap', '.'], true, envVars, srcDir);

    rebuilt = true;
  }

  return {
    rebuilt,
  };
};

export const getGoVersion = (): SemVer => {
  // Validate go version
  const versionOutput = executeCommand(['version'], false);

  if (versionOutput) {
    const parts = versionOutput.split(' ');

    // Output: go version go1.14 darwin/amd64
    if (parts.length !== 4 || !parts[2].startsWith('go') || coerce(parts[2].slice(2)) === null) {
      throw new Error(`Invalid version string: ${versionOutput}`);
    }

    const goVersion = <SemVer>coerce(parts[2].slice(2));

    return goVersion;
  }
  throw new Error(`Invalid version string: ${versionOutput}`);
};

export const checkDependencies = async (): Promise<CheckDependenciesResult> => {
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

  const version = getGoVersion();

  if (lt(version, minimumVersion) || gte(version, maximumVersion)) {
    return {
      hasRequiredDependencies: false,
      errorMessage: `${executableName} version found was: ${version.format()}, but must be between ${minimumVersion.format()} and ${maximumVersion.format()}`,
    };
  }

  return {
    hasRequiredDependencies: true,
  };
};

export const packageResource = async (request: PackageRequest, context: any): Promise<PackageResult> => {
  // check if repackaging is needed
  if (!request.lastPackageTimeStamp || request.lastBuildTimeStamp > request.lastPackageTimeStamp) {
    const packageHash = await context.amplify.hashDir(request.srcRoot, [DIST]);
    const zipFn = process.platform.startsWith('win') ? winZip : nixZip;
    try {
      await zipFn(request.srcRoot, request.dstFilename, context.print);
    } catch (err) {
      throw new AmplifyError(
        'PackagingLambdaFunctionError',
        { message: `Packaging go function failed, error message was ${err.message}` },
        err,
      );
    }
    return { packageHash };
  }
  return {};
};

const winZip = async (src: string, dest: string, print: any) => {
  // get lambda zip tool with the fix of https://go.dev/doc/go-get-install-deprecation
  const version = getGoVersion();
  try {
    if (gte(version, <SemVer>coerce('1.17'))) {
      await execa(executableName, ['install', 'github.com/aws/aws-lambda-go/cmd/build-lambda-zip@latest']);
    } else {
      await execa(executableName, ['get', '-u', 'github.com/aws/aws-lambda-go/cmd/build-lambda-zip']);
    }
  } catch (error: unknown) {
    throw new Error(`Error installing build-lambda-zip: ${error}`);
  }
  const goPath = process.env.GOPATH;
  if (!goPath) {
    throw new Error('Could not determine GOPATH. Make sure it is set.');
  }
  await execa(path.join(goPath, 'bin', 'build-lambda-zip.exe'), ['-o', dest, path.join(src, BIN, MAIN_BINARY)]);
  const resourceName = src.split(path.sep).pop();
  print.warning(
    `If the function ${resourceName} depends on assets outside of the go binary, you'll need to manually zip the binary along with the assets using WSL or another shell that generates a *nix-like zip file.`,
  );
  print.warning('See https://github.com/aws/aws-lambda-go/issues/13#issuecomment-358729411.');
};

const nixZip = async (src: string, dest: string): Promise<void> => {
  const outDir = path.join(src, BIN);
  const mainFile = path.join(outDir, MAIN_BINARY);

  // zip source and dependencies and write to specified file
  const file = fs.createWriteStream(dest);
  return new Promise<void>((resolve, reject) => {
    file.on('close', () => {
      resolve();
    });

    file.on('error', (err) => {
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

    void zip.finalize();
  });
};
