import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import { $TSAny, AmplifyError } from '@aws-amplify/amplify-cli-core';

/**
 * Certificate Info
 */
export interface ICertificateInfo {
  Certificate: string;
  PrivateKey: string;
}

/**
 * Run function of p12Decoder module
 * @param info filePath and Password for the decoder
 * @returns Certificate info
 */
export const run = (info: $TSAny): ICertificateInfo => {
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
    throw new AmplifyError('OpenSslCertificateError', {
      message: 'OpenSSL can not extract the Certificate from the p12 file',
      resolution: 'Check the p12 file and password and try again',
    });
  }
  if (!PrivateKey) {
    throw new AmplifyError('OpenSslCertificateError', {
      message: 'OpenSSL can not extract the Private Key from the p12 file',
      resolution: 'Check the p12 file and password and try again',
    });
  }

  return {
    Certificate,
    PrivateKey,
  };
};

const getPemFileContent = (filePath: string, filePassword: string): string => {
  // eslint-disable-next-line spellcheck/spell-checker
  const outputFilePath = path.join(os.tmpdir(), 'temp.pem');
  // eslint-disable-next-line spellcheck/spell-checker
  const cmd = `openssl pkcs12 -in ${filePath} -out ${outputFilePath} -nodes -passin pass:${filePassword}`;
  execSync(cmd);
  const content = fs.readFileSync(outputFilePath, 'utf8');
  fs.removeSync(outputFilePath);
  return content;
};

const getCertificate = (pemFileContent: $TSAny): string | undefined => {
  let certificate;
  const beginMark = '-----BEGIN CERTIFICATE-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END CERTIFICATE-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      certificate = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      return beginMark + os.EOL + certificate + os.EOL + endMark;
    }
  }
  return certificate;
};

const getPrivateKey = (pemFileContent: $TSAny): string | undefined => {
  let privateKey;
  const beginMark = '-----BEGIN PRIVATE KEY-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END PRIVATE KEY-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      return beginMark + os.EOL + privateKey + os.EOL + endMark;
    }
  }
  return privateKey;
};

const getRSAPrivateKey = (pemFileContent: $TSAny): string | undefined => {
  let privateKey;
  const beginMark = '-----BEGIN RSA PRIVATE KEY-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END RSA PRIVATE KEY-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      return beginMark + os.EOL + privateKey + os.EOL + endMark;
    }
  }
  return privateKey;
};

const getEncryptedPrivateKey = (pemFileContent: $TSAny): string | undefined => {
  let privateKey;
  const beginMark = '-----BEGIN ENCRYPTED PRIVATE KEY-----';
  const beginIndex = pemFileContent.indexOf(beginMark) + beginMark.length;
  if (beginIndex > -1) {
    const endMark = '-----END ENCRYPTED PRIVATE KEY-----';
    const endIndex = pemFileContent.indexOf(endMark, beginIndex);
    if (endIndex > -1) {
      privateKey = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
      return beginMark + os.EOL + privateKey + os.EOL + endMark;
    }
  }
  return privateKey;
};
