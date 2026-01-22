import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { spawnSync } from 'child_process';
import { AmplifyError } from '@aws-amplify/amplify-cli-core';

/**
 * Certificate Info
 */
export interface ICertificateInfo {
  Certificate: string;
  PrivateKey: string;
}

/**
 * P12 Decoder Input
 */
export interface IP12DecoderInput {
  P12FilePath: string;
  P12FilePassword: string;
}

/**
 * Run function of p12Decoder module
 * @param info filePath and Password for the decoder
 * @returns Certificate info
 */
export const run = (info: IP12DecoderInput): ICertificateInfo => {
  const { P12FilePath, P12FilePassword } = info;

  if (!fs.existsSync(P12FilePath)) {
    throw new AmplifyError('InputValidationError', {
      message: `The p12 file does not exist: ${P12FilePath}`,
      resolution: 'Verify the file path is correct and the file exists',
    });
  }

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
  const outputFilePath = path.join(os.tmpdir(), `amplify-${Date.now()}.pem`);
  try {
    // Use spawnSync with stdin to prevent password from being visible in process listing
    // eslint-disable-next-line spellcheck/spell-checker
    const result = spawnSync('openssl', ['pkcs12', '-in', filePath, '-out', outputFilePath, '-nodes', '-passin', 'stdin'], {
      input: filePassword,
      encoding: 'utf8',
    });
    if (result.error) {
      throw new AmplifyError('OpenSslCertificateError', {
        message: `OpenSSL command failed: ${result.error.message}`,
        resolution: 'Ensure OpenSSL is installed and accessible in your PATH',
      });
    }
    if (result.status !== 0) {
      throw new AmplifyError('OpenSslCertificateError', {
        message: `OpenSSL failed to process the p12 file: ${result.stderr || 'Unknown error'}`,
        resolution: 'Check the p12 file and password and try again',
      });
    }
    return fs.readFileSync(outputFilePath, 'utf8');
  } finally {
    if (fs.existsSync(outputFilePath)) {
      fs.removeSync(outputFilePath);
    }
  }
};

const getCertificate = (pemFileContent: string): string | undefined => {
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

const getPrivateKey = (pemFileContent: string): string | undefined => {
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

const getRSAPrivateKey = (pemFileContent: string): string | undefined => {
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

const getEncryptedPrivateKey = (pemFileContent: string): string | undefined => {
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
