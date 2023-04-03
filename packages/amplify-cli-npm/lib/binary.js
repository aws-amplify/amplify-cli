"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Binary = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const util_1 = __importDefault(require("util"));
const tar_stream_1 = __importDefault(require("tar-stream"));
const zlib_1 = require("zlib");
const stream_1 = __importDefault(require("stream"));
const os_1 = __importDefault(require("os"));
const axios_1 = __importDefault(require("axios"));
const rimraf_1 = __importDefault(require("rimraf"));
const package_json_1 = require("./package.json");
const BINARY_LOCATION = 'https://package.cli.amplify.aws';
const pipeline = util_1.default.promisify(stream_1.default.pipeline);
const error = (msg) => {
    console.error(msg);
    process.exit(1);
};
const supportedPlatforms = [
    {
        TYPE: 'Windows_NT',
        ARCHITECTURE: 'x64',
        COMPRESSED_BINARY_PATH: 'amplify-pkg-win-x64.tgz',
    },
    {
        TYPE: 'Linux',
        ARCHITECTURE: 'x64',
        COMPRESSED_BINARY_PATH: 'amplify-pkg-linux-x64.tgz',
    },
    {
        TYPE: 'Linux',
        ARCHITECTURE: 'arm64',
        COMPRESSED_BINARY_PATH: 'amplify-pkg-linux-arm64.tgz',
    },
    {
        TYPE: 'Darwin',
        ARCHITECTURE: 'x64',
        COMPRESSED_BINARY_PATH: 'amplify-pkg-macos-x64.tgz',
    },
    {
        TYPE: 'Darwin',
        ARCHITECTURE: 'arm64',
        COMPRESSED_BINARY_PATH: 'amplify-pkg-macos-x64.tgz',
    },
];
const getPlatformCompressedBinaryName = () => {
    const type = os_1.default.type();
    const architecture = os_1.default.arch();
    const platform = supportedPlatforms.find((platformInfo) => type === platformInfo.TYPE && architecture === platformInfo.ARCHITECTURE);
    if (!platform) {
        error(`Platform with type "${type}" and architecture "${architecture}" is not supported by ${package_json_1.name}.}`);
    }
    return platform.COMPRESSED_BINARY_PATH;
};
const getCompressedBinaryUrl = () => {
    const compressedBinaryName = getPlatformCompressedBinaryName();
    let url = `${BINARY_LOCATION}/${package_json_1.version}/${compressedBinaryName}`;
    if (process.env.IS_AMPLIFY_CI) {
        url = url.replace('.tgz', `-${getCommitHash()}.tgz`);
    }
    return url;
};
const getCommitHash = () => {
    if (process.env.hash) {
        return process.env.hash;
    }
    const hash = (0, child_process_1.execSync)('(git rev-parse HEAD | cut -c 1-12) || false').toString();
    return hash.substr(0, 12);
};
class Binary {
    constructor() {
        this.installDirectory = path_1.default.join(os_1.default.homedir(), '.amplify', 'bin');
        if (!fs_1.default.existsSync(this.installDirectory)) {
            fs_1.default.mkdirSync(this.installDirectory, { recursive: true });
        }
        const amplifyExecutableName = os_1.default.type() === 'Windows_NT' ? 'amplify.exe' : 'amplify';
        this.binaryPath = path_1.default.join(this.installDirectory, amplifyExecutableName);
    }
    async install() {
        if (fs_1.default.existsSync(this.installDirectory)) {
            rimraf_1.default.sync(this.installDirectory);
        }
        fs_1.default.mkdirSync(this.installDirectory, { recursive: true });
        console.log(`Downloading release from ${getCompressedBinaryUrl()}`);
        try {
            const res = await (0, axios_1.default)({ url: getCompressedBinaryUrl(), responseType: 'stream' });
            await pipeline(res.data, (0, zlib_1.createGunzip)(), this.extract());
            console.log('amplify has been installed!');
            (0, child_process_1.spawnSync)(this.binaryPath, ['version'], { cwd: process.cwd(), stdio: 'inherit' });
        }
        catch (e) {
            error(`Error fetching release: ${e.message}`);
        }
    }
    async run() {
        if (!fs_1.default.existsSync(this.binaryPath)) {
            await this.install();
        }
        const [, , ...args] = process.argv;
        const result = (0, child_process_1.spawnSync)(this.binaryPath, args, { cwd: process.cwd(), stdio: 'inherit' });
        if (args[0] === 'uninstall') {
            (0, child_process_1.spawnSync)('npm', ['uninstall', '-g', '@aws-amplify/cli'], { cwd: process.cwd(), stdio: 'inherit' });
        }
        process.exit(result.status);
    }
    extract() {
        const extract = tar_stream_1.default.extract();
        const chunks = [];
        extract.on('entry', (header, extractStream, next) => {
            if (header.type === 'file') {
                extractStream.on('data', (chunk) => {
                    chunks.push(chunk);
                });
            }
            extractStream.on('end', () => {
                next();
            });
            extractStream.resume();
        });
        extract.on('finish', () => {
            if (chunks.length) {
                const data = Buffer.concat(chunks);
                fs_1.default.writeFileSync(this.binaryPath, data, {
                    mode: 0o755,
                });
            }
        });
        return extract;
    }
}
exports.Binary = Binary;
//# sourceMappingURL=binary.js.map