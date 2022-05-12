const { ensureDir, readFile, remove, writeFile } = require('fs-extra');
const extract = require('extract-zip');
const nodefetch = require('node-fetch');
const { join } = require('path');
const hash = require('hash.js');

const main = async () => {
  const ddbSimulatorUrl = 'https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip';
  const sha256Url = 'https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip.sha256';

  const emulatorDirPath = join(__dirname, '..', 'emulator');
  const sha256FilePath = join(emulatorDirPath, 'sha256');


  const latestSha256 = (await nodefetch(sha256Url).then(res => res.text())).split(' ')[0];
  await ensureDir(emulatorDirPath);

  let previousSha256;
  try {
    previousSha256 = (await readFile(sha256FilePath)).toString();
  } catch {
    previousSha256 = undefined;
  }

  if (previousSha256 !== latestSha256) {
    const ddbSimulatorZip = await nodefetch(ddbSimulatorUrl).then(res => res.buffer());
    const ddbSimulatorZipPath = join(__dirname, '..', 'ddbSimulator.zip');

    const computedSha256 = hash.sha256().update(ddbSimulatorZip).digest('hex');
    if (latestSha256 !== computedSha256) {
      throw Error(`SHA256 DID NOT MATCH CHECKSUM. EXPECTED: ${latestSha256} RECEIVED: ${computedSha256}`);
    }

    // TODO: find a way to extract the zip file directly from memory
    await writeFile(ddbSimulatorZipPath, ddbSimulatorZip);
    await extract(ddbSimulatorZipPath, { dir: emulatorDirPath });
    return Promise.all([writeFile(sha256FilePath, latestSha256), remove(ddbSimulatorZipPath)]);
  }
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
