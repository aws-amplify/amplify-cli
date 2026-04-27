/* eslint-disable @typescript-eslint/no-explicit-any */
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, downloadData, getProperties, remove } from 'aws-amplify/storage';
import { signUp, config } from './signup';

const testImageBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAA3klEQVR42u3QMQEAAAgDILV/51nBzwci0JlYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqz8WgGPGAGBPQqrHAAAAABJRU5ErkJggg==';

function uploadTestImage(): Promise<{ path: string }> {
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const fileName = `test-image-${Date.now()}.png`;
  const s3Path = `public/images/${fileName}`;
  return uploadData({ path: s3Path, data: imageBuffer, options: { contentType: 'image/png' } }).result;
}

beforeAll(async () => {
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('guest', () => {
  it('can read a public file', async () => {
    const { path } = await uploadTestImage();
    await signOut();

    const downloadResult = await downloadData({ path }).result;
    const blob = await downloadResult.body.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    expect(buffer.length).toBeGreaterThan(0);

    const creds = await signUp(config);
    await signIn({ username: creds.username, password: creds.password });
  });

  it('cannot upload a file', async () => {
    await signOut();

    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const s3Path = `public/images/unauthorized-${Date.now()}.png`;

    await expect(uploadData({ path: s3Path, data: imageBuffer, options: { contentType: 'image/png' } }).result).rejects.toBeDefined();

    const creds = await signUp(config);
    await signIn({ username: creds.username, password: creds.password });
  });
});

describe('auth', () => {
  it('uploads a file', async () => {
    const result = await uploadTestImage();

    expect(result.path).toBeDefined();
    expect(typeof result.path).toBe('string');
    expect(result.path).toContain('public/images/');
  });

  it('gets a signed URL', async () => {
    const { path } = await uploadTestImage();
    const result = await getUrl({ path, options: { expiresIn: 3600 } });

    expect(result.url).toBeDefined();
    expect(result.url.toString()).toContain('http');
    expect(result.expiresAt).toBeDefined();
  });

  it('gets file properties', async () => {
    const { path } = await uploadTestImage();
    const properties = await getProperties({ path });

    expect(properties).toBeDefined();
    expect((properties as any).contentType).toBeDefined();
    expect((properties as any).size).toBeGreaterThan(0);
  });

  it('downloads a file', async () => {
    const { path } = await uploadTestImage();
    const downloadResult = await downloadData({ path }).result;
    const blob = await downloadResult.body.blob();
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    expect(buffer.length).toBeGreaterThan(0);
    expect(blob.type).toBeDefined();
  });

  it('deletes a file', async () => {
    const { path } = await uploadTestImage();
    await remove({ path });

    await expect(getProperties({ path })).rejects.toBeDefined();
  });
});
