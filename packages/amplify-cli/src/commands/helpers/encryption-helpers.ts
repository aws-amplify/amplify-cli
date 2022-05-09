import { getPublicKey } from './get-public-key'
import crypto from 'crypto';

export const encryptBuffer = async (text: Buffer, passKey: string): Promise<string> => {
    const masterKey =  Buffer.from(passKey, 'utf-8');
    // random initialization vector
    const iv = crypto.randomBytes(16);

    // random salt
    const salt = crypto.randomBytes(64);

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = crypto.pbkdf2Sync(masterKey, salt, 2145, 32, 'sha512');
    // AES 256 GCM Mode
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(text), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}



export const encryptKey =  async(key: string): Promise<string> => {
    const publicKey = await getPublicKey();
    return crypto.publicEncrypt({
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
        oaepHash: 'sha256'
    }, Buffer.from(key)).toString('base64');
}