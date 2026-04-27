/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { getProduct } from '../src/graphql/queries';
import { createProduct } from '../src/graphql/mutations';
import { signUp, configureAmplify } from './signup';

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('auth', () => {
  it('uploads data with a key', async () => {
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-image-${Date.now()}.png`;

    const result = await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    expect(typeof result.key).toBe('string');
    expect(result.key).toBe(fileName);
  });

  it('gets a signed URL for an uploaded key', async () => {
    const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-url-${Date.now()}.png`;

    await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    const result = await getUrl({
      key: fileName,
      options: { expiresIn: 3600 },
    });

    expect(result.url).toBeDefined();
    const urlStr = result.url.toString();
    expect(urlStr.length).toBeGreaterThan(0);
    expect(urlStr).toContain('http');
  });

  it('S3 upload triggers imageUploadedAt update on the product', async () => {
    const currentUser = await getCurrentUser();
    const auth = () => generateClient();

    const createResult = await auth().graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword: `S3 Trigger Test ${Date.now()}`,
          price: 10,
          category: 'Test',
          stock: 1,
          createdBy: currentUser.userId,
          updatedBy: currentUser.userId,
        },
      },
    });
    const product = (createResult as any).data.createProduct;
    expect(product.imageUploadedAt).toBeNull();

    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64',
    );
    await uploadData({
      key: `images/${product.id}_test.png`,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    // Poll until the S3 trigger updates imageUploadedAt (async)
    let updatedProduct: any = null;
    for (let attempt = 0; attempt < 15; attempt++) {
      const getResult = await auth().graphql({ query: getProduct, variables: { id: product.id } });
      updatedProduct = (getResult as any).data.getProduct;
      if (updatedProduct.imageUploadedAt) break;
      await new Promise((r) => setTimeout(r, 2000));
    }

    expect(updatedProduct.imageUploadedAt).not.toBeNull();
    expect(typeof updatedProduct.imageUploadedAt).toBe('string');
  }, 45_000);
});
