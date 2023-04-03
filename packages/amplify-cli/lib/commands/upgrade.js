"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.run = void 0;
const amplify_cli_core_1 = require("amplify-cli-core");
const node_fetch_1 = __importDefault(require("node-fetch"));
const semver_1 = require("semver");
const path = __importStar(require("path"));
const fs = __importStar(require("fs-extra"));
const chalk_1 = __importDefault(require("chalk"));
const gunzip_maybe_1 = __importDefault(require("gunzip-maybe"));
const tar_fs_1 = __importDefault(require("tar-fs"));
const progress_1 = __importDefault(require("progress"));
const stream_1 = require("stream");
const util_1 = require("util");
const win_constants_1 = require("../utils/win-constants");
const repoOwner = 'aws-amplify';
const repoName = 'amplify-cli';
const binName = (platform) => `amplify-pkg-${platform}`;
const binUrl = (version, binaryName) => `https://github.com/${repoOwner}/${repoName}/releases/download/v${version}/${binaryName}.tgz`;
const latestVersionUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/releases/latest`;
const run = async (context) => {
    if (!amplify_cli_core_1.isPackaged) {
        context.print.warning('"upgrade" is not supported in this installation of Amplify.');
        context.print.info(`Use ${chalk_1.default.blueBright('npm i -g @aws-amplify/cli')} instead.`);
        return;
    }
    const { version: thisVersion } = require('../../package.json');
    if (typeof thisVersion !== 'string') {
        throw new Error('Cannot determine current CLI version. Try uninstalling and reinstalling the CLI.');
    }
    const latestVersion = await getLatestVersion();
    if ((0, semver_1.gt)(latestVersion, thisVersion)) {
        await upgradeCli(context.print, latestVersion);
        context.print.success(`Successfully upgraded to Amplify CLI version ${latestVersion}!`);
    }
    else {
        context.print.info('This is the latest Amplify CLI version.');
    }
};
exports.run = run;
const upgradeCli = async (print, version) => {
    const isWin = process.platform.startsWith('win');
    const binDir = path.join(amplify_cli_core_1.pathManager.getHomeDotAmplifyDirPath(), 'bin');
    const binPath = path.join(binDir, isWin ? 'amplify.exe' : 'amplify');
    const platformSuffix = isWin ? 'win.exe' : process.platform === 'darwin' ? 'macos' : 'linux';
    const extractedName = binName(platformSuffix);
    const extractedPath = path.join(binDir, extractedName);
    const url = binUrl(version, extractedName);
    if (isWin) {
        await fs.move(binPath, win_constants_1.oldVersionPath);
    }
    const response = await (0, node_fetch_1.default)(url);
    if (response.status >= 400) {
        throw new Error(`${response.status}: Request to ${url} failed:\n${JSON.stringify(response.json(), null, 2)}`);
    }
    const len = response.headers.get('content-length');
    if (!len) {
        throw new Error('No content length specified!');
    }
    const downloadLength = parseInt(len, 10);
    const progressBar = new progress_1.default(':percent [:bar] :eta seconds left', {
        complete: '=',
        incomplete: ' ',
        width: 40,
        total: downloadLength,
        renderThrottle: 100,
    });
    print.info('Downloading latest Amplify CLI');
    const downloadPromise = (0, util_1.promisify)(stream_1.pipeline)(response.body, (0, gunzip_maybe_1.default)(), tar_fs_1.default.extract(binDir));
    response.body.on('data', (chunk) => progressBar.tick(chunk.length));
    await downloadPromise;
    await fs.move(extractedPath, binPath, { overwrite: true });
    await fs.chmod(binPath, '700');
};
const getLatestVersion = async () => {
    const response = await (0, node_fetch_1.default)(latestVersionUrl);
    if (response.status === 204)
        return '';
    const result = await response.json();
    if (response.status >= 400) {
        throw new Error(`${response.status}: Request to ${latestVersionUrl} failed:\n${JSON.stringify(result, null, 2)}`);
    }
    return result.tag_name.slice(1).trim();
};
//# sourceMappingURL=upgrade.js.map