const fs = require('fs-extra');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

function run(info) {
  const { P12FilePath, P12FilePassword } = info;
  const pemFileContent = getPemFileContent(P12FilePath, P12FilePassword);
  const Certificate = getCertificate(pemFileContent);
  let PrivateKey = getPrivateKey(pemFileContent);
  if (!PrivateKey) {
    PrivateKey = getRSAPrivateKey(pemFileContent);
  }
  if (!PrivateKey) {
    PrivateKey = getEncryptedPrivateKey(pemFileContent);
  }

  if (!Certificate) {
    const errorMessage = 'Openssl can not extract the Certificate from the p12 file';
    throw new Error(errorMessage);
  }
  if (!PrivateKey) {
    const errorMessage = 'Openssl can not extract the Private Key from the p12 file';
    throw new Error(errorMessage);
  }

  return {
    Certificate,
    PrivateKey,
  };
}

function getPemFileContent(infp, pswd) {
  const outfp = path.join(os.tmpdir(), 'temp.pem');
  const cmd = `openssl pkcs12 -in ${infp} -out ${outfp} -nodes -passin pass:${pswd}`;
  execSync(cmd);
  const content = fs.readFileSync(outfp, 'utf8');
  fs.removeSync(outfp);
  return content;
}

function getCertificate(pemFileContent) {
  let certificate;
  const beginMark = '-----BEGIN CERTIFICATE-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END CERTIFICATE-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      certificate = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      certificate = beginMark + os.EOL + certificate + os.EOL + endMark;
    }
  }
  return certificate;
}

function getPrivateKey(pemFileContent) {
  let privateKey;
  const beginMark = '-----BEGIN PRIVATE KEY-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END PRIVATE KEY-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      privateKey = beginMark + os.EOL + privateKey + os.EOL + endMark;
    }
  }
  return privateKey;
}

function getRSAPrivateKey(pemFileContent) {
  let privateKey;
  const beginMark = '-----BEGIN RSA PRIVATE KEY-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END RSA PRIVATE KEY-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      privateKey = beginMark + os.EOL + privateKey + os.EOL + endMark;
    }
  }
  return privateKey;
}

function getEncryptedPrivateKey(pemFileContent) {
  let privateKey;
  const beginMark = '-----BEGIN ENCRYPTED PRIVATE KEY-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END ENCRYPTED PRIVATE KEY-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      privateKey = beginMark + os.EOL + privateKey + os.EOL + endMark;
    }
  }
  return privateKey;
}

module.exports = {
  run,
};
