import { existsSync, mkdirSync, createWriteStream } from 'fs';
import { join } from 'path';
import { spawnSync, execSync } from 'child_process';
import util from 'util';
import stream from 'stream';
import os from 'os';
import axios from 'axios';
import rimraf from 'rimraf';
import { version, name } from './package.json';

const BINARY_LOCATION = 'https://d2bkhsss993doa.cloudfront.net';

const pipeline = util.promisify(stream.pipeline);

const error = (msg: string|Error): void => {
  console.error(msg);
  process.exit(1);
};

const supportedPlatforms = [
  {
    TYPE: 'Windows_NT',
    ARCHITECTURE: 'x64',
    BINARY_NAME: 'amplify-pkg-win.exe',
  },
  {
    TYPE: 'Linux',
    ARCHITECTURE: 'x64',
    BINARY_NAME: 'amplify-pkg-linux-x64',
  },
  {
    TYPE: 'Linux',
    ARCHITECTURE: 'arm64',
    BINARY_NAME: 'amplify-pkg-linux-arm64',
  },
  {
    TYPE: 'Darwin',
    ARCHITECTURE: 'x64',
    BINARY_NAME: 'amplify-pkg-macos',
  },
  {
    TYPE: 'Darwin',
    ARCHITECTURE: 'arm64',
    BINARY_NAME: 'amplify-pkg-macos',
  },
];

/**
 * Gets an object with platform information
 *
 * @returns Object
 */
const getPlatformBinaryName = (): string => {
  const type = os.type();
  const architecture = os.arch();
  const platform = supportedPlatforms.find(platformInfo => type === platformInfo.TYPE && architecture === platformInfo.ARCHITECTURE);
  if (!platform) {
    error(
      `Platform with type "${type}" and architecture "${architecture}" is not supported by ${name}.}`,
    );
  }

  return platform!.BINARY_NAME;
};

/**
 * Get url where desired binary can be downloaded
 *
 * @returns string
 */
const getBinaryUrl = (): string => {
  const binaryName = getPlatformBinaryName();
  let url = `${BINARY_LOCATION}/${version}/${binaryName}`;
  if (process.env.IS_AMPLIFY_CI) {
    if (url.endsWith('.exe')) {
      url = url.replace('.exe', `-${getCommitHash()}.exe`);
    } else {
      url += `-${getCommitHash()}`;
    }
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
    this.installDirectory = join(os.homedir(), '.amplify', 'bin');

    if (!existsSync(this.installDirectory)) {
      mkdirSync(this.installDirectory, { recursive: true });
    }

    let amplifyExecutableName = 'amplify';
    if (getPlatformBinaryName().endsWith('.exe')) {
      amplifyExecutableName = 'amplify.exe';
    }
    this.binaryPath = join(this.installDirectory, amplifyExecutableName);
  }

  /**
   * Downloads the binary to the installDirectory
   */
  async install(): Promise<void> {
    if (existsSync(this.installDirectory)) {
      rimraf.sync(this.installDirectory);
    }

    mkdirSync(this.installDirectory, { recursive: true });
    console.log(`Downloading release from ${getBinaryUrl()}`);
    try {
      const res = await axios({ url: getBinaryUrl(), responseType: 'stream' });
      await pipeline(
        res.data,
        createWriteStream(this.binaryPath, {
          mode: 0o755,
        }),
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
    if (!existsSync(this.binaryPath)) {
      await this.install();
    }

    const [, , ...args] = process.argv;
    const result = spawnSync(this.binaryPath, args, { cwd: process.cwd(), stdio: 'inherit' });

    process.exit(result.status as number);
  }
}
