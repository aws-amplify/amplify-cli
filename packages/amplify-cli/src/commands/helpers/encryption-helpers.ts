import crypto from 'crypto';
import { getPublicKey } from './reporter-apis';

/**
 * encrypt a buffer using AES 256
 * @param text plainText as bugger to be encrypted
 * @param passKey sting pass phrase to be used for encryption
 * @returns base64 string to be encrypted
 */
export const encryptBuffer = async (text: Buffer, passKey: string): Promise<string> => {
  const masterKey = Buffer.from(passKey, 'utf-8');
  // random initialization vector
  const iv = crypto.randomBytes(16);

  // random salt
  const salt = crypto.randomBytes(64);

  const key = crypto.pbkdf2Sync(masterKey, salt, 2145, 32, 'sha512');

  // AES 256 GCM Mode
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

  // encrypt the given text
  const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

  // extract the auth tag
  const tag = cipher.getAuthTag();

  // generate output
  return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
};

/**
 * encrypts key with Asymmetric SHA 256
 * @param key to be encrypted
 * @returns encrypted string
 */
export const encryptKey = async (key: string): Promise<string> => {
  const publicKey = await getPublicKey();
  return crypto.publicEncrypt({
    key: publicKey,
    padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
    oaepHash: 'sha256',
  }, Buffer.from(key)).toString('base64');
};

/**
 * converts projectName, envName and appId to identifiers
 * @param projectName the name of the project
 * @param appId the Amplify app Id
 * @param envName the current Environment name
 * @returns
 */
export const createHashedIdentifier = (projectName: string, appId: string, envName: string | undefined): {
  projectIdentifier: string,
  projectEnvIdentifier: string,
} => {
  const projectIdentifier = crypto
    .createHash('md5')
    .update(`${projectName}-${appId}`)
    .digest('hex');
  const projectEnvIdentifier = crypto
    .createHash('md5')
    .update(`${projectName}-${appId}-${envName}`)
    .digest('hex');
  return { projectIdentifier, projectEnvIdentifier };
};
