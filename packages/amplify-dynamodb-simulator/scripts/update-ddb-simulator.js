const { ensureDir, readFile, writeFile } = require('fs-extra');
const gunzip = require('gunzip-maybe');
const hash = require('hash.js');
const nodefetch = require('node-fetch');
const { join } = require('path');
const { pipeline, Readable } = require('stream');
const tar = require('tar');
const { promisify } = require('util');

const main = async () => {
  const ddbSimulatorUrl = 'https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.tar.gz';
  const sha256Url = `${ddbSimulatorUrl}.sha256`;

  const emulatorDirPath = join(__dirname, '..', 'emulator');
  const sha256FilePath = join(emulatorDirPath, 'sha256');

  const latestSha256 = (await nodefetch(sha256Url).then((res) => res.text())).split(' ')[0];
  await ensureDir(emulatorDirPath);

  let previousSha256;
  try {
    previousSha256 = (await readFile(sha256FilePath)).toString();
  } catch {
    previousSha256 = undefined;
  }

  if (previousSha256 !== latestSha256) {
    const ddbSimulatorGunZippedTarball = await nodefetch(ddbSimulatorUrl).then((res) => res.buffer());
    const computedSha256 = hash.sha256().update(ddbSimulatorGunZippedTarball).digest('hex');
    if (latestSha256 !== computedSha256) {
      throw Error(`SHA256 DID NOT MATCH CHECKSUM. EXPECTED: ${latestSha256} RECEIVED: ${computedSha256}`);
    }

    // Create a Readable stream from the in-memory tar.gz, unzip it, and extract it to /emulator
    await promisify(pipeline)(Readable.from(ddbSimulatorGunZippedTarball), gunzip(), tar.extract({ C: 'emulator' }));

    return writeFile(sha256FilePath, latestSha256);
  }
};

main().catch((err) => {
  console.log(err);
  process.exit(1);
});
