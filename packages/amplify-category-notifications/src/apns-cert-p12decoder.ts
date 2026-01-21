import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
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
  const outputFilePath = path.join(os.tmpdir(), `amplify-${randomUUID()}.pem`);
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

const extractPemBlock = (pemFileContent: string, beginMark: string, endMark: string): string | undefined => {
  const rawIndex = pemFileContent.indexOf(beginMark);
  if (rawIndex === -1) return undefined;
  const beginIndex = rawIndex + beginMark.length;
  const endIndex = pemFileContent.indexOf(endMark, beginIndex);
  if (endIndex === -1) return undefined;
  const content = pemFileContent.slice(beginIndex, endIndex).replace(/\s/g, '');
  return beginMark + os.EOL + content + os.EOL + endMark;
};

const getCertificate = (pem: string): string | undefined =>
  extractPemBlock(pem, '-----BEGIN CERTIFICATE-----', '-----END CERTIFICATE-----');

const getPrivateKey = (pem: string): string | undefined => extractPemBlock(pem, '-----BEGIN PRIVATE KEY-----', '-----END PRIVATE KEY-----');

const getRSAPrivateKey = (pem: string): string | undefined =>
  extractPemBlock(pem, '-----BEGIN RSA PRIVATE KEY-----', '-----END RSA PRIVATE KEY-----');

const getEncryptedPrivateKey = (pem: string): string | undefined =>
  extractPemBlock(pem, '-----BEGIN ENCRYPTED PRIVATE KEY-----', '-----END ENCRYPTED PRIVATE KEY-----');
