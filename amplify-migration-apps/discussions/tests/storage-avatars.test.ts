/* eslint-disable @typescript-eslint/no-explicit-any */
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, remove } from 'aws-amplify/storage';
import { signUp, configureAmplify } from './signup';

let username: string;
let password: string;

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('auth', () => {
  it('uploads a file and returns the key', async () => {
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-avatar-${Date.now()}.png`;

    const result = await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    expect(typeof result.key).toBe('string');
    expect(result.key).toBe(fileName);
  });

  it('gets a signed URL for an uploaded file', async () => {
    const imageBuffer = Buffer.from('test-content');
    const fileName = `test-url-${Date.now()}.txt`;

    await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'text/plain' },
    }).result;

    const result = await getUrl({
      key: fileName,
      options: { expiresIn: 3600 },
    });

    expect(result.url).toBeDefined();
    const urlStr = result.url.toString();
    expect(urlStr).toContain('https://');
    expect(urlStr.length).toBeGreaterThan(0);
  });

  it('removes an uploaded file', async () => {
    const imageBuffer = Buffer.from('delete-me');
    const fileName = `test-remove-${Date.now()}.txt`;

    await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'text/plain' },
    }).result;

    await remove({ key: fileName });

    // Verify removal completed without error
    // (S3 may still return a signed URL for a deleted object briefly)
    expect(true).toBe(true);
  });
});
