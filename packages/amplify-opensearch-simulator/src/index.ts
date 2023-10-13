import waitPort from 'wait-port';
import detectPort from 'detect-port';
import execa from 'execa';
import { ensureDir, writeFileSync, existsSync } from 'fs-extra';
import gunzip from 'gunzip-maybe';
import nodeFetch from 'node-fetch';
import { join } from 'path';
import { pipeline, Readable } from 'stream';
import tar from 'tar';
import { promisify } from 'util';
const { fromEvent } = require('promise-toolbox');
import * as openpgp from 'openpgp';
import {
  $TSAny,
  AmplifyFault,
  AMPLIFY_SUPPORT_DOCS,
  isWindowsPlatform,
  GetPackageAssetPaths,
  pathManager,
  AmplifyError,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';

// default port that opensearch chooses
const basePort = 9200;

const defaultOptions: Required<OpenSearchEmulatorOptions> = {
  clusterName: 'opensearch-cluster',
  nodeName: 'opensearch-node-local',
  port: basePort,
  type: 'single-node',
  startTimeout: 20 * 1000,
};

const retryInterval = 20;
const maxRetries = 5;
export const supportedOpenSearchVersion = '1.3.0'; // latest version of OpenSearch supported by AWS ES
export const relativePathToOpensearchLocal = join('opensearch', supportedOpenSearchVersion);
export const packageName = '@aws-amplify/amplify-opensearch-simulator';

type OpenSearchEmulatorOptions = {
  port?: number;
  clusterName?: string;
  nodeName?: string;
  type?: string;
  startTimeout?: number;
};

export class OpenSearchEmulator {
  public proc: execa.ExecaChildProcess<string>;
  public opts: OpenSearchEmulatorOptions;

  constructor(proc: execa.ExecaChildProcess<string>, opts: OpenSearchEmulatorOptions) {
    this.proc = proc;
    this.opts = opts;
    return this;
  }

  public get pid(): number | undefined {
    return this.proc?.pid;
  }

  public get port(): number | undefined {
    return this.opts?.port;
  }

  public get url(): string {
    return `http://localhost:${this.port}/`;
  }

  public terminate(): Promise<void> {
    // already exited
    if (this.proc?.exitCode !== null) {
      return Promise.resolve();
    }
    this.proc?.kill();
    return fromEvent(this.proc, 'exit');
  }
}

const wait = (ms: number) => {
  let timeoutHandle: NodeJS.Timeout;
  const promise = new Promise((accept) => {
    timeoutHandle = global.setTimeout(accept, ms);
  });

  return {
    promise,
    cancel: () => {
      global.clearTimeout(timeoutHandle);
    },
  };
};

export const buildArgs = (options: OpenSearchEmulatorOptions, pathToOpenSearchData: string): string[] => {
  const args = [];

  if (options.clusterName) {
    args.push(`-Ecluster.name=${options.clusterName}`);
  }

  if (options.nodeName) {
    args.push(`-Enode.name=${options.nodeName}`);
  }

  if (options.port) {
    args.push(`-Ehttp.port=${options.port}`);
  }

  if (options.type) {
    args.push(`-Ediscovery.type=${options.type}`);
  }

  if (pathToOpenSearchData) {
    args.push(`-Epath.data=${pathToOpenSearchData}`);
  }

  return args;
};

export const launch = async (
  pathToOpenSearchData: string,
  givenOptions: OpenSearchEmulatorOptions = {},
  retry = 0,
  startTime: number = Date.now(),
): Promise<OpenSearchEmulator> => {
  if (isWindowsPlatform()) {
    throw new AmplifyError('SearchableMockUnsupportedPlatformError', {
      message: 'Cannot launch OpenSearch simulator on windows OS',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }

  // launch will retry but ensure it will not retry indefinitely.
  if (retry >= maxRetries) {
    throw new AmplifyFault('MockProcessFault', {
      message: 'Max retries hit for starting OpenSearch simulator',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }

  try {
    await ensureOpenSearchLocalExists(pathToOpenSearchData);
  } catch (error) {
    throw new AmplifyFault('MockProcessFault', {
      message: 'Failed to setup local OpenSearch simulator',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }

  let { port } = { ...defaultOptions, ...givenOptions };
  if (!port) {
    port = await detectPort(basePort);
  } else {
    const freePort = await detectPort(port);
    if (freePort !== port) {
      throw new AmplifyError('SearchableMockUnavailablePortError', {
        message: `Port ${port} is not free. Please use a different port`,
        link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
      });
    }
  }
  const opts: Required<OpenSearchEmulatorOptions> = { ...defaultOptions, ...givenOptions, port };

  const args = buildArgs(opts, pathToOpenSearchData);
  printer.info('Spawning OpenSearch Simulator with options: ' + JSON.stringify({ args, cwd: getOpensearchLocalDirectory() }));
  const openSearchBinPath = await getPathToOpenSearchBinary();

  const proc = execa(openSearchBinPath, args, {
    cwd: getOpensearchLocalDirectory(),
  });

  const emulator = await startOpensearchEmulator(opts, proc, port, startTime, givenOptions, getOpensearchLocalDirectory(), retry);
  if (!emulator) {
    throw new AmplifyError('SearchableMockProcessError', {
      message: 'Unable to start the Opensearch emulator. Please restart the mock process.',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }
  return emulator;
};

export const startOpensearchEmulator = async (
  opts: Required<OpenSearchEmulatorOptions>,
  proc: execa.ExecaChildProcess<string>,
  port: number,
  startTime: number,
  givenOptions: OpenSearchEmulatorOptions,
  pathToOpenSearchData: string,
  retry: number,
): Promise<OpenSearchEmulator | undefined> => {
  function startingTimeout() {
    printer.error('Failed to start within timeout');
    // ensure process is halted.
    proc?.kill();
    const err: $TSAny = new Error('start has timed out!');
    err.code = 'timeout';
    throw err;
  }

  // define this now so we can use it later to remove a listener.
  let prematureExit: $TSAny;
  let waiter: $TSAny;
  /*
   This is a fairly complex set of logic, similar to the DynamoDB emulator,
   to retry starting the emulator if it fails to start. We need this logic due
   to possible race conditions between when we find an open
   port and bind to it. This situation is particularly common
   in jest where each test file is running in it's own process
   each competing for the open port.
  */
  try {
    waiter = wait(opts.startTimeout);
    await Promise.race([
      startingEmulatorPromise(opts, proc, port),
      waiter.promise.then(startingTimeout),
      exitingEmulatorPromise(proc, prematureExit),
    ]);
    printer.info('Successfully launched OpenSearch Simulator on' + JSON.stringify({ port, time: Date.now() - startTime }));
  } catch (err) {
    // retry starting the Simulator after a small "back off" time
    // if we have a premature exit or the port is bound in a different process.
    if (err.code === 'premature' || err.code === 'port_taken') {
      if (givenOptions.port) {
        throw new Error(`${givenOptions.port} is bound and unavailable`);
      }
      printer.info('Queue retry in' + retryInterval);
      return wait(retryInterval).promise.then(() => launch(pathToOpenSearchData, givenOptions, retry + 1, startTime));
    }
    throw err;
  } finally {
    waiter && waiter.cancel();
    if (typeof prematureExit === 'function') {
      void proc.removeListener('exit', prematureExit);
    }
  }
  return new OpenSearchEmulator(proc, opts);
};

export const startingEmulatorPromise = (opts: Required<OpenSearchEmulatorOptions>, proc: execa.ExecaChildProcess<string>, port: number) => {
  return new Promise((accept, reject) => {
    let stdout = '';
    let stderr = '';

    function readStderrBuffer(buffer: { toString: () => string }) {
      stderr += buffer.toString();

      // Check stderr for any known errors.
      if (/^Invalid directory to start OpenSearch.$/.test(stderr)) {
        proc?.stdout?.removeListener('data', readStdoutBuffer);
        proc?.stderr?.removeListener('data', readStderrBuffer);
        const err: $TSAny = new Error('invalid directory to start OpenSearch');
        err.code = 'bad_config';
        reject(err);
      }
    }

    function readStdoutBuffer(buffer: { toString: () => string }) {
      stdout += buffer.toString();

      if (stdout.indexOf(opts.port.toString()) !== -1) {
        proc?.stdout?.removeListener('data', readStdoutBuffer);
        proc?.stderr?.removeListener('data', readStderrBuffer);
        accept(
          waitPort({
            host: 'localhost',
            port,
            output: 'silent',
          }),
        );
      }
    }
    proc?.stderr?.on('data', readStderrBuffer);
    proc?.stdout?.on('data', readStdoutBuffer);
  });
};

export const exitingEmulatorPromise = (proc: execa.ExecaChildProcess<string>, prematureExit: $TSAny) => {
  return new Promise((accept, reject) => {
    prematureExit = () => {
      const err: $TSAny = new Error('premature exit');
      err.code = 'premature';
      void proc.removeListener('exit', prematureExit);
      reject(err);
    };
    void proc.on('exit', prematureExit);
  });
};

export const ensureOpenSearchLocalExists = async (pathToOpenSearchData: string) => {
  await ensureDir(pathToOpenSearchData);
  const pathToOpenSearchLocal = getOpensearchLocalDirectory();
  if (await openSearchLocalExists(pathToOpenSearchLocal)) {
    return;
  }

  const opensearchMinLinuxArtifactUrl = `https://artifacts.opensearch.org/releases/core/opensearch/${supportedOpenSearchVersion}/opensearch-min-${supportedOpenSearchVersion}-linux-x64.tar.gz`;
  const sigFileUrl = `${opensearchMinLinuxArtifactUrl}.sig`;
  const publicKeyUrl = `https://artifacts.opensearch.org/publickeys/opensearch.pgp`;

  await ensureDir(pathToOpenSearchLocal);

  const latestSig = await nodeFetch(sigFileUrl).then((res) => res.buffer());

  const latestPublicKey = await nodeFetch(publicKeyUrl).then((res) => res.text());
  const opensearchSimulatorGunZippedTarball = await nodeFetch(opensearchMinLinuxArtifactUrl).then((res) => res.buffer());

  const signature = await openpgp.readSignature({ binarySignature: latestSig });
  const publickey = await openpgp.readKey({ armoredKey: latestPublicKey });
  const message = await openpgp.createMessage({ binary: new Uint8Array(opensearchSimulatorGunZippedTarball) });
  const verificationResult = await openpgp.verify({
    message: message,
    signature: signature,
    verificationKeys: publickey,
  });

  const { verified } = verificationResult.signatures[0];
  const verifyResult = await verified;

  if (!verifyResult) {
    throw new AmplifyFault('MockProcessFault', {
      message: 'PGP signature of downloaded OpenSearch binary did not match',
      link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
    });
  }

  await writeOpensearchEmulatorArtifacts(pathToOpenSearchLocal, opensearchSimulatorGunZippedTarball, latestSig, latestPublicKey);
};

export const writeOpensearchEmulatorArtifacts = async (
  pathToOpenSearchLocal: string,
  opensearchSimulatorGunZippedTarball: $TSAny,
  latestSig: $TSAny,
  latestPublicKey: $TSAny,
) => {
  const pathToOpenSearchLib = join(pathToOpenSearchLocal, 'opensearchLib');
  await ensureDir(pathToOpenSearchLib);
  existsSync(pathToOpenSearchLib);
  const sigFilePath = join(pathToOpenSearchLocal, `opensearch-min-${supportedOpenSearchVersion}-linux-x64.tar.gz.sig`);
  const publicKeyPath = join(pathToOpenSearchLocal, 'opensearch.pgp');
  const tarFilePath = join(pathToOpenSearchLocal, `opensearch-min-${supportedOpenSearchVersion}-linux-x64.tar.gz`);
  writeFileSync(tarFilePath, opensearchSimulatorGunZippedTarball);
  writeFileSync(sigFilePath, latestSig);
  writeFileSync(publicKeyPath, latestPublicKey);
  await unzipOpensearchBuildFile(opensearchSimulatorGunZippedTarball, pathToOpenSearchLib);
};

export const unzipOpensearchBuildFile = async (opensearchSimulatorGunZippedTarball: Buffer, pathToOpenSearchLib: string) => {
  // Create a Readable stream from the in-memory tar.gz, unzip it, and extract it to 'pathToOpenSearchLib'
  await promisify(pipeline)(
    Readable.from(opensearchSimulatorGunZippedTarball),
    gunzip(),
    tar.extract({ C: pathToOpenSearchLib, stripComponents: 1 }),
  );
};

export const openSearchLocalExists = async (pathToOpenSearchLocal: string): Promise<boolean> => {
  return existsSync(await getPathToOpenSearchBinary(pathToOpenSearchLocal));
};

export const getPathToOpenSearchBinary = async (pathToOpenSearchLocal?: string): Promise<string> => {
  if (pathToOpenSearchLocal) {
    return join(pathToOpenSearchLocal, 'opensearchLib', 'bin', 'opensearch');
  }
  return join('opensearchLib', 'bin', 'opensearch');
};

export const getPackageAssetPaths: GetPackageAssetPaths = async () => [relativePathToOpensearchLocal];

export const getOpensearchLocalDirectory = () => {
  const opensearchLocalDir = pathManager.getAmplifyPackageLibDirPath(packageName);
  return join(opensearchLocalDir, relativePathToOpensearchLocal);
};
