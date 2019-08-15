const path = require('path');
const portfinder = require('portfinder');
const e2p = require('event-to-promise');
const fs = require('fs-extra');
const waitPort = require('wait-port');
const portPid = require('port-pid');
const log = require('logdown')('dynamodb-emulator');
const execa = require('execa');
const os = require('os');

// random port I chose in the ephemeral range.
const basePort = 62224;

const defaultOptions = {
    inMemory: true,
    sharedDb: false,
    dbPath: null,
    startTimeout: 20 * 1000
};

const emulatorPath = getDynamoDBLocalDirectory();
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
        return e2p(this.proc, 'exit');
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
        }
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
    const args = [
        '-Djava.library.path=./DynamoDBLocal_lib',
        '-jar',
        'DynamoDBLocal.jar',
        '-port',
        options.port
    ];
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
        port = await portfinder.getPortPromise({ port: basePort });
        log.info('found open port', { port });
    }
    const opts = { ...defaultOptions, ...givenOptions, port };

    if (opts.dbPath) {
        fs.ensureDirSync(opts.dbPath);
    }

    const java = await which('java');
    const args = buildArgs(opts);
    log.info('Spawning Emulator:', { args, cwd: emulatorPath });

    const proc = execa(java, args, {
        cwd: emulatorPath
    });

    function startingTimeout() {
        log.error('Failed to start within timeout');
        // ensure process is halted.
        proc.kill();
        const err = new Error('start has timed out!');
        err.code = 'timeout';
        throw err;
    }

    async function checkProcess() {
        // Does not work well on windows. There are couple of issue with dependcies on port-pid and netstat
        // We can enable this once the following PRs are merged
        // https://github.com/radiovisual/netstats/pull/2
        // https://github.com/radiovisual/port-pid/pull/7

        if (process.platform !== 'win32') {
            const portOnPID = await portPid(port);
            // we invoke this after verifying the port we are attempting to
            // bind has bound and we can connect. The logic here is if the
            // port is bound but we have exited we know for sure that we need
            // to retry starting the emulator.
            if (
                proc.exitCode != null ||
                // verify that _we_ bound the port rather than another process.
                portOnPID.all.length === 0 ||
                portOnPID.all.indexOf(proc.pid) === -1
            ) {
                log.error('Port bound but by another process ... time to retry');
                // port is open but it's not our process...
                const err = new Error('port taken');
                err.code = 'port_taken';
                throw err;
            }
        }
    }

    // define this now so we can use it later to remove a listener.
    let prematureExit;
    // This is a fairly complex set of logic to retry starting
    // the emulator if it fails to start. We need this logic due
    // to possible race conditions between when we find an open
    // port and bind to it. This situation is particularly common
    // in jest where each test file is running in it's own process
    // each competing for the open port.
    try {
        const waiter = wait(opts.startTimeout);
        await Promise.race([
            new Promise(accept => {
                function readStdoutBuffer(buffer) {
                    if (buffer.toString().indexOf(opts.port) !== -1) {
                        proc.stdout.removeListener('data', readStdoutBuffer);
                        log.info('Emulator has started but need to verify socket');
                        accept(
                            waitPort({
                                host: 'localhost',
                                port,
                                output: 'silent'
                            }).then(checkProcess)
                        );
                    }
                }
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
            })
        ]);
        // eventually the process will exit... ensure our logic only
        // will run on _premature_ exits.
        proc.removeListener('exit', prematureExit);
        waiter.cancel();

        log.info('Successfully launched emulator on', {
            port,
            time: Date.now() - startTime
        });
    } catch (err) {
        // retry starting the emulator after a small "back off" time
        // if we have a premature exit or the port is bound in a different process.
        if (err.code === 'premature' || err.code === 'port_taken') {
            if (givenOptions.port) {
                throw new Error(`${givenOptions.port} is bound and unavailable`);
            }
            log.info('Queue retry in', retryInterval);
            return wait(retryInterval).promise.then(() =>
                launch(givenOptions, retry + 1, startTime)
            );
        }
        throw err;
    }

    return new Emulator(proc, opts);
}

function getDynamoDBLocalDirectory() {
    const homedir = os.homedir();
    return path.join(homedir, '.amplify-dynamodb-local-emulator');
  }

function getClient(emu, options = {}) {
    const { DynamoDB } = require('aws-sdk');
    return new DynamoDB({
        endpoint: emu.url,
        region: 'us-fake-1',
        accessKeyId: 'fake',
        secretAccessKey: 'fake',
        ...options
    });
}

module.exports = {
    launch,
    getClient,
    getDynamoDBLocalDirectory
};
