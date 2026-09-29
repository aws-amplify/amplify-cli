/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Validates that the gen2-migration refactor correctly shares stateful resources
 * (AppSync/DynamoDB, S3 bucket, Lambda) between gen1 and gen2 configurations.
 *
 * Auth sharing is tested separately in shared-auth.test.ts.
 * Tests both directions: gen1→gen2 and gen2→gen1.
 */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, downloadData } from 'aws-amplify/storage';
import { signUp, configureAmplify } from './signup';
import { createProduct, createComment } from '../src/graphql/mutations';
import { getProduct, getComment, checkLowStock } from '../src/graphql/queries';
import * as fs from 'fs';

const gen1Config = JSON.parse(fs.readFileSync('src/amplifyconfiguration.json', { encoding: 'utf-8' }));
const gen2Config = JSON.parse(fs.readFileSync('amplify_outputs.json', { encoding: 'utf-8' }));

describe('gen1 to gen2', () => {
  let username: string;
  let password: string;
  let userId: string;

  beforeAll(async () => {
    configureAmplify(gen1Config);
    const creds = await signUp(gen1Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
    userId = (await getCurrentUser()).userId;
  }, 60_000);

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
  });

  it('data: product created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const engword = `Widget gen1→gen2 ${Date.now()}`;
    const result = await generateClient().graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword,
          price: 29.99,
          category: 'Test',
          stock: 10,
          createdBy: userId,
          updatedBy: userId,
        },
      },
    });
    const productId = (result as any).data.createProduct.id;

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient().graphql({
        query: getProduct,
        variables: { id: productId },
      })) as any
    ).data.getProduct;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(productId);
    expect(fetched.engword).toBe(engword);
  }, 60_000);

  it('data: comment created via gen1 can be read via gen2', async () => {
    configureAmplify(gen1Config);
    const productResult = await generateClient().graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword: `Comment Parent g1→g2 ${Date.now()}`,
          price: 5,
          category: 'Test',
          stock: 1,
          createdBy: userId,
          updatedBy: userId,
        },
      },
    });
    const productId = (productResult as any).data.createProduct.id;

    const content = `Great product gen1→gen2 ${Date.now()}`;
    const commentResult = await generateClient().graphql({
      query: createComment,
      variables: { input: { productId, authorId: userId, authorName: username, content } },
    });
    const commentId = (commentResult as any).data.createComment.id;

    configureAmplify(gen2Config);
    const fetched = (
      (await generateClient().graphql({
        query: getComment,
        variables: { id: commentId },
      })) as any
    ).data.getComment;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(commentId);
    expect(fetched.content).toBe(content);
    expect(fetched.productId).toBe(productId);
  }, 60_000);

  it('lambda: checkLowStock returns consistent results via gen1 and gen2', async () => {
    configureAmplify(gen1Config);
    const gen1Result = ((await generateClient().graphql({ query: checkLowStock })) as any).data.checkLowStock;

    configureAmplify(gen2Config);
    const gen2Result = ((await generateClient().graphql({ query: checkLowStock })) as any).data.checkLowStock;

    expect(gen2Result.message).toBe(gen1Result.message);
  }, 60_000);

  it('storage: file uploaded via gen1 can be downloaded via gen2', async () => {
    const fileContent = `gen1-to-gen2-${Date.now()}`;
    const fileName = `test-g1g2-${Date.now()}.txt`;

    configureAmplify(gen1Config);
    const uploadResult = await uploadData({
      key: fileName,
      data: Buffer.from(fileContent),
      options: { contentType: 'text/plain' },
    }).result;
    expect(uploadResult.key).toBe(fileName);

    configureAmplify(gen2Config);
    const downloadResult = await downloadData({ path: `public/${fileName}` }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
  }, 120_000);
});

describe('gen2 to gen1', () => {
  let username: string;
  let password: string;
  let userId: string;

  beforeAll(async () => {
    configureAmplify(gen2Config);
    const creds = await signUp(gen2Config);
    username = creds.username;
    password = creds.password;
    await signIn({ username, password });
    userId = (await getCurrentUser()).userId;
  }, 60_000);

  afterAll(async () => {
    try {
      await signOut();
    } catch {
      /* ignore */
    }
  });

  it('data: product created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const engword = `Gadget gen2→gen1 ${Date.now()}`;
    const result = await generateClient().graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword,
          price: 49.99,
          category: 'Test',
          stock: 20,
          createdBy: userId,
          updatedBy: userId,
        },
      },
    });
    const productId = (result as any).data.createProduct.id;

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient().graphql({
        query: getProduct,
        variables: { id: productId },
      })) as any
    ).data.getProduct;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(productId);
    expect(fetched.engword).toBe(engword);
  }, 60_000);

  it('data: comment created via gen2 can be read via gen1', async () => {
    configureAmplify(gen2Config);
    const productResult = await generateClient().graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword: `Comment Parent g2→g1 ${Date.now()}`,
          price: 5,
          category: 'Test',
          stock: 1,
          createdBy: userId,
          updatedBy: userId,
        },
      },
    });
    const productId = (productResult as any).data.createProduct.id;

    const content = `Nice item gen2→gen1 ${Date.now()}`;
    const commentResult = await generateClient().graphql({
      query: createComment,
      variables: { input: { productId, authorId: userId, authorName: username, content } },
    });
    const commentId = (commentResult as any).data.createComment.id;

    configureAmplify(gen1Config);
    const fetched = (
      (await generateClient().graphql({
        query: getComment,
        variables: { id: commentId },
      })) as any
    ).data.getComment;

    expect(fetched).not.toBeNull();
    expect(fetched.id).toBe(commentId);
    expect(fetched.content).toBe(content);
    expect(fetched.productId).toBe(productId);
  }, 60_000);

  it('lambda: checkLowStock returns consistent results via gen2 and gen1', async () => {
    configureAmplify(gen2Config);
    const gen2Result = ((await generateClient().graphql({ query: checkLowStock })) as any).data.checkLowStock;

    configureAmplify(gen1Config);
    const gen1Result = ((await generateClient().graphql({ query: checkLowStock })) as any).data.checkLowStock;

    expect(gen1Result.message).toBe(gen2Result.message);
  }, 60_000);

  it('storage: file uploaded via gen2 can be downloaded via gen1', async () => {
    const fileContent = `gen2-to-gen1-${Date.now()}`;
    const fileName = `test-g2g1-${Date.now()}.txt`;

    configureAmplify(gen2Config);
    await uploadData({ path: `public/${fileName}`, data: Buffer.from(fileContent), options: { contentType: 'text/plain' } }).result;

    configureAmplify(gen1Config);
    const downloadResult = await downloadData({ key: fileName }).result;
    const body = await downloadResult.body.text();
    expect(body).toBe(fileContent);
  }, 120_000);
});
