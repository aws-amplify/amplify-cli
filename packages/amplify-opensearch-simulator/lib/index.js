"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpensearchLocalDirectory = exports.getPackageAssetPaths = exports.getPathToOpenSearchBinary = exports.openSearchLocalExists = exports.unzipOpensearchBuildFile = exports.writeOpensearchEmulatorArtifacts = exports.ensureOpenSearchLocalExists = exports.exitingEmulatorPromise = exports.startingEmulatorPromise = exports.startOpensearchEmulator = exports.launch = exports.buildArgs = exports.OpenSearchEmulator = exports.packageName = exports.relativePathToOpensearchLocal = exports.supportedOpenSearchVersion = void 0;
const wait_port_1 = __importDefault(require("wait-port"));
const detect_port_1 = __importDefault(require("detect-port"));
const execa_1 = __importDefault(require("execa"));
const fs_extra_1 = require("fs-extra");
const gunzip_maybe_1 = __importDefault(require("gunzip-maybe"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const path_1 = require("path");
const stream_1 = require("stream");
const tar_1 = __importDefault(require("tar"));
const util_1 = require("util");
const { fromEvent } = require('promise-toolbox');
const openpgp = __importStar(require("openpgp"));
const amplify_cli_core_1 = require("@aws-amplify/amplify-cli-core");
const amplify_prompts_1 = require("@aws-amplify/amplify-prompts");
const basePort = 9200;
const defaultOptions = {
    clusterName: 'opensearch-cluster',
    nodeName: 'opensearch-node-local',
    port: basePort,
    type: 'single-node',
    startTimeout: 20 * 1000,
};
const retryInterval = 20;
const maxRetries = 5;
exports.supportedOpenSearchVersion = '1.3.0';
exports.relativePathToOpensearchLocal = (0, path_1.join)('opensearch', exports.supportedOpenSearchVersion);
exports.packageName = '@aws-amplify/amplify-opensearch-simulator';
class OpenSearchEmulator {
    constructor(proc, opts) {
        this.proc = proc;
        this.opts = opts;
        return this;
    }
    get pid() {
        var _a;
        return (_a = this.proc) === null || _a === void 0 ? void 0 : _a.pid;
    }
    get port() {
        var _a;
        return (_a = this.opts) === null || _a === void 0 ? void 0 : _a.port;
    }
    get url() {
        return `http://localhost:${this.port}/`;
    }
    terminate() {
        var _a, _b;
        if (((_a = this.proc) === null || _a === void 0 ? void 0 : _a.exitCode) !== null) {
            return Promise.resolve();
        }
        (_b = this.proc) === null || _b === void 0 ? void 0 : _b.kill();
        return fromEvent(this.proc, 'exit');
    }
}
exports.OpenSearchEmulator = OpenSearchEmulator;
const wait = (ms) => {
    let timeoutHandle;
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
const buildArgs = (options, pathToOpenSearchData) => {
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
exports.buildArgs = buildArgs;
const launch = async (pathToOpenSearchData, givenOptions = {}, retry = 0, startTime = Date.now()) => {
    if ((0, amplify_cli_core_1.isWindowsPlatform)()) {
        throw new amplify_cli_core_1.AmplifyError('SearchableMockUnsupportedPlatformError', {
            message: 'Cannot launch OpenSearch simulator on windows OS',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    if (retry >= maxRetries) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'Max retries hit for starting OpenSearch simulator',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    try {
        await (0, exports.ensureOpenSearchLocalExists)(pathToOpenSearchData);
    }
    catch (error) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'Failed to setup local OpenSearch simulator',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    let { port } = { ...defaultOptions, ...givenOptions };
    if (!port) {
        port = await (0, detect_port_1.default)(basePort);
    }
    else {
        const freePort = await (0, detect_port_1.default)(port);
        if (freePort !== port) {
            throw new amplify_cli_core_1.AmplifyError('SearchableMockUnavailablePortError', {
                message: `Port ${port} is not free. Please use a different port`,
                link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
    }
    const opts = { ...defaultOptions, ...givenOptions, port };
    const args = (0, exports.buildArgs)(opts, pathToOpenSearchData);
    amplify_prompts_1.printer.info('Spawning OpenSearch Simulator with options: ' + JSON.stringify({ args, cwd: (0, exports.getOpensearchLocalDirectory)() }));
    const openSearchBinPath = await (0, exports.getPathToOpenSearchBinary)();
    const proc = (0, execa_1.default)(openSearchBinPath, args, {
        cwd: (0, exports.getOpensearchLocalDirectory)(),
    });
    const emulator = await (0, exports.startOpensearchEmulator)(opts, proc, port, startTime, givenOptions, (0, exports.getOpensearchLocalDirectory)(), retry);
    if (!emulator) {
        throw new amplify_cli_core_1.AmplifyError('SearchableMockProcessError', {
            message: 'Unable to start the Opensearch emulator. Please restart the mock process.',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    return emulator;
};
exports.launch = launch;
const startOpensearchEmulator = async (opts, proc, port, startTime, givenOptions, pathToOpenSearchData, retry) => {
    function startingTimeout() {
        amplify_prompts_1.printer.error('Failed to start within timeout');
        proc === null || proc === void 0 ? void 0 : proc.kill();
        const err = new Error('start has timed out!');
        err.code = 'timeout';
        throw err;
    }
    let prematureExit;
    let waiter;
    try {
        waiter = wait(opts.startTimeout);
        await Promise.race([
            (0, exports.startingEmulatorPromise)(opts, proc, port),
            waiter.promise.then(startingTimeout),
            (0, exports.exitingEmulatorPromise)(proc, prematureExit),
        ]);
        amplify_prompts_1.printer.info('Successfully launched OpenSearch Simulator on' + JSON.stringify({ port, time: Date.now() - startTime }));
    }
    catch (err) {
        if (err.code === 'premature' || err.code === 'port_taken') {
            if (givenOptions.port) {
                throw new Error(`${givenOptions.port} is bound and unavailable`);
            }
            amplify_prompts_1.printer.info('Queue retry in' + retryInterval);
            return wait(retryInterval).promise.then(() => (0, exports.launch)(pathToOpenSearchData, givenOptions, retry + 1, startTime));
        }
        throw err;
    }
    finally {
        waiter && waiter.cancel();
        if (typeof prematureExit === 'function') {
            void proc.removeListener('exit', prematureExit);
        }
    }
    return new OpenSearchEmulator(proc, opts);
};
exports.startOpensearchEmulator = startOpensearchEmulator;
const startingEmulatorPromise = (opts, proc, port) => {
    return new Promise((accept, reject) => {
        var _a, _b;
        let stdout = '';
        let stderr = '';
        function readStderrBuffer(buffer) {
            var _a, _b;
            stderr += buffer.toString();
            if (/^Invalid directory to start OpenSearch.$/.test(stderr)) {
                (_a = proc === null || proc === void 0 ? void 0 : proc.stdout) === null || _a === void 0 ? void 0 : _a.removeListener('data', readStdoutBuffer);
                (_b = proc === null || proc === void 0 ? void 0 : proc.stderr) === null || _b === void 0 ? void 0 : _b.removeListener('data', readStderrBuffer);
                const err = new Error('invalid directory to start OpenSearch');
                err.code = 'bad_config';
                reject(err);
            }
        }
        function readStdoutBuffer(buffer) {
            var _a, _b;
            stdout += buffer.toString();
            if (stdout.indexOf(opts.port.toString()) !== -1) {
                (_a = proc === null || proc === void 0 ? void 0 : proc.stdout) === null || _a === void 0 ? void 0 : _a.removeListener('data', readStdoutBuffer);
                (_b = proc === null || proc === void 0 ? void 0 : proc.stderr) === null || _b === void 0 ? void 0 : _b.removeListener('data', readStderrBuffer);
                accept((0, wait_port_1.default)({
                    host: 'localhost',
                    port,
                    output: 'silent',
                }));
            }
        }
        (_a = proc === null || proc === void 0 ? void 0 : proc.stderr) === null || _a === void 0 ? void 0 : _a.on('data', readStderrBuffer);
        (_b = proc === null || proc === void 0 ? void 0 : proc.stdout) === null || _b === void 0 ? void 0 : _b.on('data', readStdoutBuffer);
    });
};
exports.startingEmulatorPromise = startingEmulatorPromise;
const exitingEmulatorPromise = (proc, prematureExit) => {
    return new Promise((accept, reject) => {
        prematureExit = () => {
            const err = new Error('premature exit');
            err.code = 'premature';
            void proc.removeListener('exit', prematureExit);
            reject(err);
        };
        void proc.on('exit', prematureExit);
    });
};
exports.exitingEmulatorPromise = exitingEmulatorPromise;
const ensureOpenSearchLocalExists = async (pathToOpenSearchData) => {
    await (0, fs_extra_1.ensureDir)(pathToOpenSearchData);
    const pathToOpenSearchLocal = (0, exports.getOpensearchLocalDirectory)();
    if (await (0, exports.openSearchLocalExists)(pathToOpenSearchLocal)) {
        return;
    }
    const opensearchMinLinuxArtifactUrl = `https://artifacts.opensearch.org/releases/core/opensearch/${exports.supportedOpenSearchVersion}/opensearch-min-${exports.supportedOpenSearchVersion}-linux-x64.tar.gz`;
    const sigFileUrl = `${opensearchMinLinuxArtifactUrl}.sig`;
    const publicKeyUrl = `https://artifacts.opensearch.org/publickeys/opensearch.pgp`;
    await (0, fs_extra_1.ensureDir)(pathToOpenSearchLocal);
    const latestSig = await (0, node_fetch_1.default)(sigFileUrl).then((res) => res.buffer());
    const latestPublicKey = await (0, node_fetch_1.default)(publicKeyUrl).then((res) => res.text());
    const opensearchSimulatorGunZippedTarball = await (0, node_fetch_1.default)(opensearchMinLinuxArtifactUrl).then((res) => res.buffer());
    const signature = await openpgp.signature.read(latestSig);
    const publickey = await openpgp.key.readArmored(latestPublicKey);
    const message = await openpgp.message.fromBinary(new Uint8Array(opensearchSimulatorGunZippedTarball));
    const verificationResult = await openpgp.verify({
        message: message,
        signature: signature,
        publicKeys: publickey.keys,
    });
    const { verified } = verificationResult.signatures[0];
    const verifyResult = await verified;
    if (!verifyResult) {
        throw new amplify_cli_core_1.AmplifyFault('MockProcessFault', {
            message: 'PGP signature of downloaded OpenSearch binary did not match',
            link: amplify_cli_core_1.AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
        });
    }
    await (0, exports.writeOpensearchEmulatorArtifacts)(pathToOpenSearchLocal, opensearchSimulatorGunZippedTarball, latestSig, latestPublicKey);
};
exports.ensureOpenSearchLocalExists = ensureOpenSearchLocalExists;
const writeOpensearchEmulatorArtifacts = async (pathToOpenSearchLocal, opensearchSimulatorGunZippedTarball, latestSig, latestPublicKey) => {
    const pathToOpenSearchLib = (0, path_1.join)(pathToOpenSearchLocal, 'opensearchLib');
    await (0, fs_extra_1.ensureDir)(pathToOpenSearchLib);
    (0, fs_extra_1.existsSync)(pathToOpenSearchLib);
    const sigFilePath = (0, path_1.join)(pathToOpenSearchLocal, `opensearch-min-${exports.supportedOpenSearchVersion}-linux-x64.tar.gz.sig`);
    const publicKeyPath = (0, path_1.join)(pathToOpenSearchLocal, 'opensearch.pgp');
    const tarFilePath = (0, path_1.join)(pathToOpenSearchLocal, `opensearch-min-${exports.supportedOpenSearchVersion}-linux-x64.tar.gz`);
    (0, fs_extra_1.writeFileSync)(tarFilePath, opensearchSimulatorGunZippedTarball);
    (0, fs_extra_1.writeFileSync)(sigFilePath, latestSig);
    (0, fs_extra_1.writeFileSync)(publicKeyPath, latestPublicKey);
    await (0, exports.unzipOpensearchBuildFile)(opensearchSimulatorGunZippedTarball, pathToOpenSearchLib);
};
exports.writeOpensearchEmulatorArtifacts = writeOpensearchEmulatorArtifacts;
const unzipOpensearchBuildFile = async (opensearchSimulatorGunZippedTarball, pathToOpenSearchLib) => {
    await (0, util_1.promisify)(stream_1.pipeline)(stream_1.Readable.from(opensearchSimulatorGunZippedTarball), (0, gunzip_maybe_1.default)(), tar_1.default.extract({ C: pathToOpenSearchLib, stripComponents: 1 }));
};
exports.unzipOpensearchBuildFile = unzipOpensearchBuildFile;
const openSearchLocalExists = async (pathToOpenSearchLocal) => {
    return (0, fs_extra_1.existsSync)(await (0, exports.getPathToOpenSearchBinary)(pathToOpenSearchLocal));
};
exports.openSearchLocalExists = openSearchLocalExists;
const getPathToOpenSearchBinary = async (pathToOpenSearchLocal) => {
    if (pathToOpenSearchLocal) {
        return (0, path_1.join)(pathToOpenSearchLocal, 'opensearchLib', 'bin', 'opensearch');
    }
    return (0, path_1.join)('opensearchLib', 'bin', 'opensearch');
};
exports.getPathToOpenSearchBinary = getPathToOpenSearchBinary;
const getPackageAssetPaths = async () => [exports.relativePathToOpensearchLocal];
exports.getPackageAssetPaths = getPackageAssetPaths;
const getOpensearchLocalDirectory = () => {
    const opensearchLocalDir = amplify_cli_core_1.pathManager.getAmplifyPackageLibDirPath(exports.packageName);
    return (0, path_1.join)(opensearchLocalDir, exports.relativePathToOpensearchLocal);
};
exports.getOpensearchLocalDirectory = getOpensearchLocalDirectory;
//# sourceMappingURL=index.js.map