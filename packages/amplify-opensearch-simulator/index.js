const { fromEvent } = require('promise-toolbox');
const waitPort = require('wait-port');
const detectPort = require('detect-port');
const log = require('logdown')('opensearch-emulator');
const execa = require('execa');
const { ensureDir, writeFileSync, existsSync } = require('fs-extra');
const gunzip = require('gunzip-maybe');
const nodefetch = require('node-fetch');
const { join } = require('path');
const { pipeline, Readable } = require('stream');
const tar = require('tar');
const { promisify } = require('util');
openpgp = require('openpgp');

// default port that opensearch chooses
const basePort = 9200;

const defaultOptions = {
  clusterName: 'opensearch-cluster',
  nodeName: 'opensearch-node-local',
  port: 9200, // default port for opensearch
  type: 'single-node',
  startTimeout: 20 * 1000,
};

const retryInterval = 20;
const maxRetries = 5;

class OpenSearchEmulator {
  constructor(proc, opts) {
    this.proc = proc;
    this.opts = opts;
    return this;
  }

  get pid() {
    return this.proc.pid;
  }

  get port() {
    return this.opts.port;
  }

  get url() {
    return `http://localhost:${this.port}/`;
  }

  terminate() {
    // already exited
    if (this.proc.exitCode != null) {
      return this.proc.exitCode;
    }
    this.proc.kill();
    return fromEvent(this.proc, 'exit');
  }
}

const wait = ms => {
  let timeoutHandle;
  const promise = new Promise(accept => {
    timeoutHandle = setTimeout(accept, ms);
  });

  return {
    promise,
    cancel: () => {
      clearTimeout(timeoutHandle);
    },
  };
};

function buildArgs(options) {
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

  return args;
}

async function launch(pathToOpenSearchLocal, givenOptions = {}, retry = 0, startTime = Date.now()) { 
  if (process.platform.startsWith('win')) {
    throw new Error('Cannot launch OpenSearch simulator on windows OS');
  }

  log.info('launching OpenSearch Simulator with options: ', { retry, givenOptions });
  // launch will retry but ensure it will not retry indefinitely.
  if (retry >= maxRetries) {
    throw new Error('Max retries hit for starting OpenSearch simulator');
  }

  try {
    await ensureOpenSearchLocalExists(pathToOpenSearchLocal);
  } catch (error) {
    throw new Error('Failed to setup local OpenSearch simulator');
  }

  let { port } = givenOptions;
  if (!port) {
    port = await detectPort(basePort);
    log.info('found open port', { port });
  } else {
    const freePort = await detectPort(port);
    if (freePort !== port) {
      throw new Error(`Port ${port} is not free. Please use a different port`);
    }
  }
  const opts = { ...defaultOptions, ...givenOptions, port };

  const args = buildArgs(opts);
  log.info('Spawning OpenSearch Simulator:', { args, cwd: pathToOpenSearchLocal });
  const openSearchBinPath = await getPathToOpenSearchBinary();

  const proc = execa(openSearchBinPath, args, {
    cwd: pathToOpenSearchLocal,
  });

  function startingTimeout() {
    log.error('Failed to start within timeout');
    // ensure process is halted.
    proc.kill();
    const err = new Error('start has timed out!');
    err.code = 'timeout';
    throw err;
  }

  // define this now so we can use it later to remove a listener.
  let prematureExit;
  let waiter;
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
      new Promise((accept, reject) => {
        let stdout = '';
        let stderr = '';

        function readStderrBuffer(buffer) {
          stderr += buffer.toString();

          // Check stderr for any known errors.
          if (/^Invalid directory to start OpenSearch.$/.test(stderr)) {
            proc.stdout.removeListener('data', readStdoutBuffer);
            proc.stderr.removeListener('data', readStderrBuffer);
            const err = new Error('invalid directory to start OpenSearch');
            err.code = 'bad_config';
            reject(err);
          }
        }

        function readStdoutBuffer(buffer) {
          stdout += buffer.toString();

          if (stdout.indexOf(opts.port) !== -1) {
            proc.stdout.removeListener('data', readStdoutBuffer);
            proc.stderr.removeListener('data', readStderrBuffer);
            log.info('OpenSearch Simulator has started but need to verify socket');
            accept(
              waitPort({
                host: 'localhost',
                port,
                output: 'silent',
              }),
            );
          }
        }
        proc.stderr.on('data', readStderrBuffer);
        proc.stdout.on('data', readStdoutBuffer);
      }),
      waiter.promise.then(startingTimeout),
      new Promise((accept, reject) => {
        prematureExit = () => {
          log.error('Opensearch Simulator has prematurely exited... need to retry');
          const err = new Error('premature exit');
          err.code = 'premature';
          proc.removeListener('exit', prematureExit);
          reject(err);
        };
        proc.on('exit', prematureExit);
      }),
    ]);

    log.info('Successfully launched OpenSearch Simulator on', {
      port,
      time: Date.now() - startTime,
    });
  } catch (err) {
    // retry starting the Simulator after a small "back off" time
    // if we have a premature exit or the port is bound in a different process.
    if (err.code === 'premature' || err.code === 'port_taken') {
      if (givenOptions.port) {
        throw new Error(`${givenOptions.port} is bound and unavailable`);
      }
      log.info('Queue retry in', retryInterval);
      return wait(retryInterval).promise.then(() => launch(givenOptions, retry + 1, startTime));
    }
    throw err;
  } finally {
    waiter && waiter.cancel();
    if (typeof prematureExit === 'function') {
      proc.removeListener('exit', prematureExit);
    }
  }

  return new OpenSearchEmulator(proc, opts);
}

const ensureOpenSearchLocalExists = async (pathToOpenSearchLocal) => {
  if (await openSearchLocalExists(pathToOpenSearchLocal)) {
    return;
  }
  // Download the latest version of OpenSearch supported by AWS ES
  const supportedOpenSearchVersion = '1.3.0';
  const opensearchMinLinuxArtifactUrl = `https://artifacts.opensearch.org/releases/core/opensearch/${supportedOpenSearchVersion}/opensearch-min-${supportedOpenSearchVersion}-linux-x64.tar.gz`;
  const sigFileUrl = `${opensearchMinLinuxArtifactUrl}.sig`;
  const publicKeyUrl = `https://artifacts.opensearch.org/publickeys/opensearch.pgp`;

  const sigFilePath = join(pathToOpenSearchLocal, `opensearch-min-${supportedOpenSearchVersion}-linux-x64.tar.gz.sig`);
  const publicKeyPath = join(pathToOpenSearchLocal, 'opensearch.pgp');
  const tarFilePath = join(pathToOpenSearchLocal, `opensearch-min-${supportedOpenSearchVersion}-linux-x64.tar.gz`);

  await ensureDir(pathToOpenSearchLocal);

  const latestSig = (await nodefetch(sigFileUrl).then(res => res.buffer()));

  const latestPublicKey = (await nodefetch(publicKeyUrl).then(res => res.text()));
  const opensearchSimulatorGunZippedTarball = await nodefetch(opensearchMinLinuxArtifactUrl).then(res => res.buffer());

  const signature = await openpgp.signature.read(latestSig);
  const publickey = await openpgp.key.readArmored(latestPublicKey);
  const message = await openpgp.message.fromBinary(new Uint8Array(opensearchSimulatorGunZippedTarball));
  const verificationResult = await openpgp.verify({
    message: message,
    signature: signature,
    publicKeys: publickey.keys
  });

  const { verified } = verificationResult.signatures[0];
  const verifyResult = await verified;

  if (verifyResult) {
    const pathToOpenSearchLib = join(pathToOpenSearchLocal, 'opensearchLib');
    await ensureDir(pathToOpenSearchLib);
    existsSync(pathToOpenSearchLib);
    // Create a Readable stream from the in-memory tar.gz, unzip it, and extract it to 'pathToOpenSearchLib'
    await promisify(pipeline)(Readable.from(opensearchSimulatorGunZippedTarball), gunzip(), tar.extract({ C: pathToOpenSearchLib, stripComponents: 1 }));
    writeFileSync(sigFilePath, latestSig);
    writeFileSync(publicKeyPath, latestPublicKey);
    writeFileSync(tarFilePath, opensearchSimulatorGunZippedTarball);
  }
  else {
    throw new Error('PGP signature of downloaded OpenSearch binary did not match');
  }
}

const openSearchLocalExists = async (pathToOpenSearchLocal) => {
  return existsSync(await getPathToOpenSearchBinary(pathToOpenSearchLocal));
}

const getPathToOpenSearchBinary = async (pathToOpenSearchLocal) => {
  if (pathToOpenSearchLocal) {
    return join(pathToOpenSearchLocal, 'opensearchLib', 'bin', 'opensearch');
  }
  return join('opensearchLib', 'bin', 'opensearch');
}

module.exports = {
  launch,
  getPathToOpenSearchBinary,
  ensureOpenSearchLocalExists,
  openSearchLocalExists,
  buildArgs
};
