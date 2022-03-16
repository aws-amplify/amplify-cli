const path = require('path');
const { fromEvent } = require('promise-toolbox');
const fs = require('fs-extra');
const waitPort = require('wait-port');
const detectPort = require('detect-port');
const log = require('logdown')('dynamodb-emulator');
const execa = require('execa');
const { pathManager } = require('amplify-cli-core');

// random port I chose in the ephemeral range.
const basePort = 62224;

const defaultOptions = {
  inMemory: true,
  sharedDb: false,
  dbPath: null,
  startTimeout: 20 * 1000,
};

const packageName = 'amplify-dynamodb-simulator';
const relativeEmulatorPath = 'emulator';

const emulatorPath = path.join(pathManager.getAmplifyPackageLibDirPath(packageName), relativeEmulatorPath);
const retryInterval = 20;
const maxRetries = 5;

class Emulator {
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

async function which(bin) {
  return new Promise((accept, reject) => {
    require('which')(bin, (err, value) => {
      if (err) return reject(err);
      return accept(value);
    });
  });
}

function buildArgs(options) {
  const args = [];

  if (options.javaOpts) {
    args.push(...options.javaOpts.split(' '));
  }

  args.push(...['-Djava.library.path=./DynamoDBLocal_lib', '-jar', 'DynamoDBLocal.jar', '-port', options.port]);
  if (options.dbPath) {
    args.push('-dbPath');
    args.push(options.dbPath);
  }

  // dbPath overrides in memory
  if (options.inMemory && !options.dbPath) {
    args.push('-inMemory');
  }
  if (options.sharedDb) {
    args.push('-sharedDb');
  }
  return args;
}

async function launch(givenOptions = {}, retry = 0, startTime = Date.now()) {
  log.info('launching', { retry, givenOptions });
  // launch will retry but ensure it will not retry indefinitely.
  if (retry >= maxRetries) {
    throw new Error('max retries hit for starting dynamodb emulator');
  }

  if (givenOptions.inMemory && givenOptions.dbPath) {
    throw new Error('inMemory and dbPath are mutually exclusive options');
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

  if (opts.dbPath) {
    fs.ensureDirSync(opts.dbPath);
  }

  const java = await which('java');
  const args = buildArgs(opts);
  log.info('Spawning Emulator:', { args, cwd: emulatorPath });

  const proc = execa(java, args, {
    cwd: emulatorPath,
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
  // This is a fairly complex set of logic to retry starting
  // the emulator if it fails to start. We need this logic due
  // to possible race conditions between when we find an open
  // port and bind to it. This situation is particularly common
  // in jest where each test file is running in it's own process
  // each competing for the open port.
  try {
    waiter = wait(opts.startTimeout);
    await Promise.race([
      new Promise((accept, reject) => {
        let stdout = '';
        let stderr = '';

        function readStderrBuffer(buffer) {
          stderr += buffer.toString();

          // Check stderr for any known errors.
          if (/^Invalid directory for database creation.$/.test(stderr)) {
            proc.stdout.removeListener('data', readStdoutBuffer);
            proc.stderr.removeListener('data', readStderrBuffer);
            const err = new Error('invalid directory for database creation');
            err.code = 'bad_config';
            reject(err);
          }
        }

        function readStdoutBuffer(buffer) {
          stdout += buffer.toString();

          if (stdout.indexOf(opts.port) !== -1) {
            proc.stdout.removeListener('data', readStdoutBuffer);
            proc.stderr.removeListener('data', readStderrBuffer);
            log.info('Emulator has started but need to verify socket');
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
          log.error('Dynamo DB Simulator has prematurely exited... need to retry');
          const err = new Error('premature exit');
          err.code = 'premature';
          proc.removeListener('exit', prematureExit);
          reject(err);
        };
        proc.on('exit', prematureExit);
      }),
    ]);

    log.info('Successfully launched emulator on', {
      port,
      time: Date.now() - startTime,
    });
  } catch (err) {
    // retry starting the emulator after a small "back off" time
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

  return new Emulator(proc, opts);
}

function getClient(emu, options = {}) {
  const { DynamoDB } = require('aws-sdk');
  return new DynamoDB({
    endpoint: emu.url,
    region: 'us-fake-1',
    accessKeyId: 'fake',
    secretAccessKey: 'fake',
    ...options,
  });
}

const getPackageAssetPaths = async () => [relativeEmulatorPath];

module.exports = {
  launch,
  getClient,
  getPackageAssetPaths,
};
