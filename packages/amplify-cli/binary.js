const os = require('os');
const fs = require('fs');
const cTable = require('console.table');
const { execSync } = require('child_process');
const ci = require('ci-info');
const { Binary } = require('./index');

const error = msg => {
  console.error(msg);
  process.exit(1);
};

const { version, name, binaryLocation } = require('./package.json');

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

const getPlatformMetadata = () => {
  const type = os.type();
  const architecture = os.arch();

  for (const index in supportedPlatforms) {
    if (type === supportedPlatforms[index].TYPE && architecture === supportedPlatforms[index].ARCHITECTURE) {
      return supportedPlatforms[index];
    }
  }

  error(
    `Platform with type "${type}" and architecture "${architecture}" is not supported by ${name}.\nYour system must be one of the following:\n\n${cTable.getTable(
      supportedPlatforms,
    )}`,
  );
};

const getBinary = () => {
  const platformMetadata = getPlatformMetadata();
  let url = `${binaryLocation}/${version}/${platformMetadata.BINARY_NAME}`;
  if (ci.isCI || process.env.SUDO_USER === 'circleci') {
    if (url.includes('.exe')) {
      url = url.replace('.exe', `-${getCommitHash()}.exe`);
    } else {
      url += `-${getCommitHash()}`;
    }
  }
  return new Binary(platformMetadata.BINARY_NAME, url);
};

function getCommitHash() {
  if (process.env.hash) {
    return process.env.hash;
  }
  const hash = execSync('(git rev-parse HEAD | cut -c 1-12) || false').toString();
  return hash.substr(0, 12);
}

/**
 *
 */
const run = async () => {
  const binary = getBinary();
  if (!fs.existsSync(binary.binaryPath)) {
    await binary.install();
  }
  binary.run();
};

/**
 *
 */
const install = () => {
  const binary = getBinary();
  binary.install();
};

module.exports = {
  install,
  run,
};
