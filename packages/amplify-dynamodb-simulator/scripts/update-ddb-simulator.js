const { ensureDir, readFile, remove, writeFile } = require('fs-extra');
const extract = require('extract-zip');
const nodefetch = require('node-fetch');
const { join } = require('path');

const main = async () => {
  const ddbSimulatorUrl = 'https://s3-us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip';
  const sha256Url = 'https://s3.us-west-2.amazonaws.com/dynamodb-local/dynamodb_local_latest.zip.sha256';

  const emulatorDirPath = join(__dirname, '..', 'emulator');
  const sha256FilePath = join(emulatorDirPath, 'sha256');


  const sha256 = await nodefetch(sha256Url).then(res => res.text());
  await ensureDir(emulatorDirPath);

  let previousHash;
  try {
    previousHash = (await readFile(sha256FilePath)).toString();
  } catch {
    previousHash = undefined;
  }

  if (previousHash !== sha256) {
    const ddbSimulatorZip = await nodefetch(ddbSimulatorUrl).then(res => res.buffer());
    const ddbSimulatorZipPath = join(__dirname, '..', 'ddbSimulator.zip');
    await writeFile(ddbSimulatorZipPath, ddbSimulatorZip);
    await extract(ddbSimulatorZipPath, { dir: emulatorDirPath });
    return Promise.all([writeFile(sha256FilePath, sha256), remove(ddbSimulatorZipPath)]);
  }
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
