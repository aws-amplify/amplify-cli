const { ensureDir, writeFileSync, emptyDir } = require('fs-extra');
const gunzip = require('gunzip-maybe');
const nodefetch = require('node-fetch');
const { join } = require('path');
const { pipeline, Readable } = require('stream');
const tar = require('tar');
const { promisify } = require('util');
openpgp = require('openpgp');

const main = async () => {
  const opensearchReleases = 'https://api.github.com/repos/opensearch-project/OpenSearch/releases/latest';
  const opensearchLatestVersion = (await nodefetch(opensearchReleases).then( res => res.json()).then(res => res.tag_name));

  const opensearchMinArtifactUrl = `https://artifacts.opensearch.org/releases/core/opensearch/${opensearchLatestVersion}/opensearch-min-${opensearchLatestVersion}-linux-x64.tar.gz`;
  const sigFileUrl = `${opensearchMinArtifactUrl}.sig`;
  const publicKeyUrl = `https://artifacts.opensearch.org/publickeys/opensearch.pgp`;

  const emulatorDirPath = join(__dirname, '..', 'emulator');
  const sigFilePath = join(emulatorDirPath, `opensearch-min-${opensearchLatestVersion}-linux-x64.tar.gz.sig`);
  const publicKeyPath = join(emulatorDirPath, 'opensearch.pgp');
  const tarFilePath = join(emulatorDirPath, `opensearch-min-${opensearchLatestVersion}-linux-x64.tar.gz`);
  const versionFilePath = join(emulatorDirPath, 'version.txt');

  await ensureDir(emulatorDirPath);

  const latestSig = (await nodefetch(sigFileUrl).then(res => res.buffer()));

  let previousVersion;
  try {
    previousVersion = (await readFile(versionFilePath)).toString();
  } catch {
    previousVersion = undefined;
  }

  if (previousVersion !== opensearchLatestVersion) {
    const latestPublicKey = (await nodefetch(publicKeyUrl).then(res => res.text()));
    const opensearchSimulatorGunZippedTarball = await nodefetch(opensearchMinArtifactUrl).then(res => res.buffer());

    const signature = await openpgp.signature.read(latestSig);
    const publickey = await openpgp.key.readArmored(latestPublicKey);
    const message = await openpgp.message.fromBinary(new Uint8Array(opensearchSimulatorGunZippedTarball));
    

    const verificationResult = await openpgp.verify({
        message: message,
        signature: signature,
        publicKeys: publickey.keys
    });
    
    const { verified } = verificationResult.signatures[0];
    const verifyResult = await verified;

    if (verifyResult) {
      await emptyDir(emulatorDirPath);
      await ensureDir(join(emulatorDirPath, 'opensearchLib'));
      // Create a Readable stream from the in-memory tar.gz, unzip it, and extract it to /emulator
      await promisify(pipeline)(Readable.from(opensearchSimulatorGunZippedTarball), gunzip(), tar.extract({ C: join('emulator', 'opensearchLib'), stripComponents: 1 }));
      writeFileSync(sigFilePath, latestSig);
      writeFileSync(publicKeyPath, latestPublicKey);
      writeFileSync(tarFilePath, opensearchSimulatorGunZippedTarball);
    }
  }
}

main().catch(err => {
  console.log(err);
  process.exit(1);
});
