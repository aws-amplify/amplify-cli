/* eslint-disable @typescript-eslint/no-explicit-any */
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { signUp, config } from './signup';

beforeAll(async () => {
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('S3 storage', () => {
  it('uploads a receipt image', async () => {
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const filePath = `public/uploads/${Date.now()}-receipt.png`;

    const result = await uploadData({
      path: filePath,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    expect(result.path).toBe(filePath);
  });

  it('gets a signed URL for an uploaded receipt', async () => {
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const filePath = `public/uploads/${Date.now()}-receipt-url.png`;

    await uploadData({
      path: filePath,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    const result = await getUrl({ path: filePath });

    expect(result.url).toBeDefined();
    expect(result.url.toString()).toContain('receipt');
  });
});
