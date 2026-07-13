/* eslint-disable @typescript-eslint/no-explicit-any */
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, downloadData, remove } from 'aws-amplify/storage';
import { signUp, configureAmplify } from './signup';

const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('guest', () => {
  it('can read a public file', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-guest-read-${Date.now()}.png`;

    await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    await signOut();

    const downloadResult = await downloadData({ key: fileName }).result;
    const blob = await downloadResult.body.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    expect(buffer.length).toBeGreaterThan(0);

    const config = configureAmplify();
    const creds = await signUp(config);
    await signIn({ username: creds.username, password: creds.password });
  });

  it('cannot upload a file', async () => {
    await signOut();

    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `unauthorized-${Date.now()}.png`;

    await expect(uploadData({ key: fileName, data: imageBuffer, options: { contentType: 'image/png' } }).result).rejects.toBeDefined();

    const config = configureAmplify();
    const creds = await signUp(config);
    await signIn({ username: creds.username, password: creds.password });
  });
});

describe('auth', () => {
  it('uploads a file', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-upload-${Date.now()}.png`;

    const result = await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    expect(result.key).toBe(fileName);
  });

  it('gets a signed URL', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-geturl-${Date.now()}.png`;

    await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    const result = await getUrl({ key: fileName, options: { expiresIn: 3600 } });

    expect(result.url).toBeDefined();
    expect(result.url.toString()).toContain(fileName);
  });

  it('removes a file', async () => {
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-remove-${Date.now()}.png`;

    await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    await remove({ key: fileName });
  });
});
