import fs from 'fs';
import path from 'path';
import { spawnSync, execSync } from 'child_process';
import util from 'util';
import tar from 'tar-stream';
import { createGunzip } from 'zlib';
import stream from 'stream';
import os from 'os';
import axios from 'axios';
import rimraf from 'rimraf';
import { name, version } from './package.json';

const BINARY_LOCATION = 'https://package.cli.amplify.aws';

const pipeline = util.promisify(stream.pipeline);

const error = (msg: string|Error): void => {
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

/**
 * Gets an object with platform information
 *
 * @returns Object
 */
const getPlatformCompressedBinaryName = (): string => {
  const type = os.type();
  const architecture = os.arch();
  const platform = supportedPlatforms.find(platformInfo => type === platformInfo.TYPE && architecture === platformInfo.ARCHITECTURE);
  if (!platform) {
    error(
      `Platform with type "${type}" and architecture "${architecture}" is not supported by ${name}.}`,
    );
  }

  return platform!.COMPRESSED_BINARY_PATH;
};

/**
 * Get url where desired binary can be downloaded
 *
 * @returns string
 */
const getCompressedBinaryUrl = (): string => {
  const compressedBinaryName = getPlatformCompressedBinaryName();
  let url = `${BINARY_LOCATION}/${version}/${compressedBinaryName}`;

  if (process.env.IS_AMPLIFY_CI) {
    url = url.replace('.tgz', `-${getCommitHash()}.tgz`);
  }

  return url;
};

/**
 * CI-only, used for testing hash-based binaries
 *
 * @returns string
 */
const getCommitHash = (): string => {
  if (process.env.hash) {
    return process.env.hash;
  }
  const hash = execSync('(git rev-parse HEAD | cut -c 1-12) || false').toString();
  return hash.substr(0, 12);
};

/**
 * Wraps logic to download and run binary
 */
export class Binary {
  public binaryPath: string;
  public installDirectory: string;
  constructor() {
    this.installDirectory = path.join(os.homedir(), '.amplify', 'bin');

    if (!fs.existsSync(this.installDirectory)) {
      fs.mkdirSync(this.installDirectory, { recursive: true });
    }

    const amplifyExecutableName = os.type() === 'Windows_NT' ? 'amplify.exe' : 'amplify';
    this.binaryPath = path.join(this.installDirectory, amplifyExecutableName);
  }

  /**
   * Downloads the binary to the installDirectory
   */
  async install(): Promise<void> {
    if (fs.existsSync(this.installDirectory)) {
      rimraf.sync(this.installDirectory);
    }

    fs.mkdirSync(this.installDirectory, { recursive: true });
    console.log(`Downloading release from ${getCompressedBinaryUrl()}`);
    try {
      const res = await axios({ url: getCompressedBinaryUrl(), responseType: 'stream' });
      await pipeline(
        res.data,
        createGunzip(),
        this.extract(),
      );

      console.log('amplify has been installed!');
      spawnSync(this.binaryPath, ['version'], { cwd: process.cwd(), stdio: 'inherit' });
    } catch (e) {
      error(`Error fetching release: ${e.message}`);
    }
  }

  /**
   * Passes all arguments into the downloaded binary
   */
  async run(): Promise<void> {
    if (!fs.existsSync(this.binaryPath)) {
      await this.install();
    }

    const [, , ...args] = process.argv;
    const result = spawnSync(this.binaryPath, args, { cwd: process.cwd(), stdio: 'inherit' });
    if (args[0] === 'uninstall') {
      spawnSync('npm', ['uninstall', '-g', '@aws-amplify/cli'], { cwd: process.cwd(), stdio: 'inherit' });
    }
    process.exit(result.status as number);
  }

  /**
   * Extracts a .tar file
   *
   * @returns tar.Extract
   */
  private extract(): tar.Extract {
    const extract = tar.extract();
    const chunks: Uint8Array[] = [];
    extract.on('entry', (header, extractStream, next) => {
      if (header.type === 'file') {
        extractStream.on('data', chunk => {
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
        fs.writeFileSync(this.binaryPath, data, {
          mode: 0o755,
        });
      }
    });
    return extract;
  }
}
