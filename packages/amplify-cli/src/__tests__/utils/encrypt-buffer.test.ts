import { encryptBuffer, encryptKey } from '../../commands/helpers/encryption-helpers';
import { v4 } from 'uuid';
import crypto from 'crypto';
describe('encryption helper', () => {
  it('tests encryption helper', async () => {
    const originalKey = v4();
    const plainText = crypto.randomBytes(10);
    const encryptedText = await encryptBuffer(plainText, originalKey);
    const bData = Buffer.from(encryptedText, 'base64');

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text = bData.slice(96);

    const masterkey = Buffer.from(originalKey, 'utf-8');

    // derive key using; 32 byte key length
    const key = crypto.pbkdf2Sync(masterkey, salt, 2145, 32, 'sha512');

    // AES 256 GCM Mode
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted = decipher.update(text) + decipher.final('utf8');
    expect(decrypted).toEqual(plainText.toString('utf8'));
  });

  it('test encryption key', async () => {
    jest.setTimeout(10000);
    expect(await encryptKey(v4())).toBeTruthy();
  });
});
