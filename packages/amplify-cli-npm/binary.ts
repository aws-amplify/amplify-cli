import os from 'os';
import fs from 'fs';
import { execSync } from 'child_process';
import { Binary } from './index';
import { version, name, binaryLocation } from './package.json';

const error = (msg: string): void => {
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
    BINARY_NAME: 'amplify-pkg-linux',
  },
  {
    TYPE: 'Darwin',
    ARCHITECTURE: 'x64',
    BINARY_NAME: 'amplify-pkg-macos',
  },
];

/**
 * Gets an object with platform information
 *
 * @returns Object
 */
const getPlatformMetadata = (): {BINARY_NAME: string} => {
  const type = os.type();
  const architecture = os.arch();
  const platform = supportedPlatforms.find(platformInfo => type === platformInfo.TYPE && architecture === platformInfo.ARCHITECTURE);
  if (!platform) {
    error(
      `Platform with type "${type}" and architecture "${architecture}" is not supported by ${name}.}`,
    );
  }

  return platform as {BINARY_NAME: string};
};

/**
 * Get instance of binary manager
 *
 * @returns Binary
 */
const getBinary = (): { run: () => void, install: () => void, binaryPath: string } => {
  const platformMetadata = getPlatformMetadata();
  let url = `${binaryLocation}/${version}/${platformMetadata.BINARY_NAME}`;
  if (process.env.IS_AMPLIFY_CI) {
    if (url.includes('.exe')) {
      url = url.replace('.exe', `-${getCommitHash()}.exe`);
    } else {
      url += `-${getCommitHash()}`;
    }
  }
  return new Binary(platformMetadata.BINARY_NAME, url);
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
 * proxies commands to the downloaded binary
 */
export const run = async (): Promise<void> => {
  const binary = getBinary();
  if (!fs.existsSync(binary.binaryPath)) {
    await binary.install();
  }
  binary.run();
};

/**
 * downloads the amplify cli binary
 */
export const install = async (): Promise<void> => {
  const binary = getBinary();
  return binary.install();
};
