/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import {
  getProduct, listProducts,
  getUser, listUsers,
  getComment, listComments,
  commentsByProductId,
  checkLowStock,
} from '../src/graphql/queries';
import {
  createProduct, updateProduct, deleteProduct,
  createUser, updateUser, deleteUser,
  createComment, updateComment, deleteComment,
} from '../src/graphql/mutations';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const CONFIG_PATH = process.env.APP_CONFIG_PATH;
if (!CONFIG_PATH) {
  throw new Error('APP_CONFIG_PATH environment variable is required');
}
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: 'utf-8' }));
Amplify.configure(config);

let username: string;
let password: string;

async function signUp(cfg: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (cfg as any)?.auth;
  const userPoolId = cfg.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = cfg.aws_cognito_region ?? gen2Auth?.aws_region;

  const email = generateTestEmail();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: pwd,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: email,
    Password: pwd,
    Permanent: true,
  }));

  return { username: email, password: pwd };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}

beforeAll(async () => {
  const creds = await signUp(config);
  username = creds.username;
  password = creds.password;
  await signIn({ username, password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('Product', () => {
  const client = () => generateClient();
  let productId: string;

  it('creates a product with correct fields', async () => {
    const currentUser = await getCurrentUser();
    const input = {
      serialno: Math.floor(Math.random() * 10000),
      engword: `Test Product ${Date.now()}`,
      price: 99.99,
      category: 'Electronics',
      description: 'Test product created by jest',
      stock: 50,
      brand: 'TestBrand',
      createdBy: currentUser.userId,
      updatedBy: currentUser.userId,
    };

    const result = await client().graphql({ query: createProduct, variables: { input } });
    const product = (result as any).data.createProduct;
    productId = product.id;

    expect(typeof product.id).toBe('string');
    expect(product.id.length).toBeGreaterThan(0);
    expect(product.engword).toBe(input.engword);
    expect(product.price).toBe(99.99);
    expect(product.category).toBe('Electronics');
    expect(product.description).toBe('Test product created by jest');
    expect(product.stock).toBe(50);
    expect(product.brand).toBe('TestBrand');
    expect(product.createdBy).toBe(currentUser.userId);
    expect(product.updatedBy).toBe(currentUser.userId);
  });

  it('reads a product by id', async () => {
    const result = await client().graphql({ query: getProduct, variables: { id: productId } });
    const product = (result as any).data.getProduct;

    expect(product).not.toBeNull();
    expect(product.id).toBe(productId);
    expect(product.category).toBe('Electronics');
    expect(product.stock).toBe(50);
  });

  it('updates a product and persists changes', async () => {
    const currentUser = await getCurrentUser();
    await client().graphql({
      query: updateProduct,
      variables: {
        input: {
          id: productId,
          engword: 'Updated Test Product',
          price: 149.99,
          stock: 75,
          updatedBy: currentUser.userId,
        },
      },
    });

    const result = await client().graphql({ query: getProduct, variables: { id: productId } });
    const product = (result as any).data.getProduct;

    expect(product.engword).toBe('Updated Test Product');
    expect(product.price).toBe(149.99);
    expect(product.stock).toBe(75);
    expect(product.updatedBy).toBe(currentUser.userId);
  });

  it('lists products including the created one', async () => {
    const result = await client().graphql({ query: listProducts });
    const items = (result as any).data.listProducts.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((p: any) => p.id === productId);
    expect(found).toBeDefined();
    expect(found.engword).toBe('Updated Test Product');
  });

  it('deletes a product', async () => {
    await client().graphql({ query: deleteProduct, variables: { input: { id: productId } } });

    const result = await client().graphql({ query: getProduct, variables: { id: productId } });
    expect((result as any).data.getProduct).toBeNull();
  });
});

describe('User', () => {
  const client = () => generateClient();
  let userId: string;

  it('creates a user with correct fields', async () => {
    userId = `test-user-${Date.now()}`;
    const input = {
      id: userId,
      email: `testuser${Date.now()}@example.com`,
      name: `Test User ${Date.now()}`,
      role: 'VIEWER',
    };

    const result = await client().graphql({ query: createUser, variables: { input } });
    const user = (result as any).data.createUser;

    expect(user.id).toBe(userId);
    expect(user.email).toBe(input.email);
    expect(user.name).toBe(input.name);
    expect(user.role).toBe('VIEWER');
  });

  it('reads a user by id', async () => {
    const result = await client().graphql({ query: getUser, variables: { id: userId } });
    const user = (result as any).data.getUser;

    expect(user).not.toBeNull();
    expect(user.id).toBe(userId);
    expect(user.role).toBe('VIEWER');
  });

  it('updates user role from VIEWER to MANAGER', async () => {
    await client().graphql({ query: updateUser, variables: { input: { id: userId, role: 'MANAGER' } } });

    const result = await client().graphql({ query: getUser, variables: { id: userId } });
    const user = (result as any).data.getUser;

    expect(user.role).toBe('MANAGER');
  });

  it('updates user role from MANAGER to ADMIN', async () => {
    await client().graphql({ query: updateUser, variables: { input: { id: userId, role: 'ADMIN' } } });

    const result = await client().graphql({ query: getUser, variables: { id: userId } });
    const user = (result as any).data.getUser;

    expect(user.role).toBe('ADMIN');
  });

  it('lists users including the created one', async () => {
    const result = await client().graphql({ query: listUsers });
    const items = (result as any).data.listUsers.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((u: any) => u.id === userId);
    expect(found).toBeDefined();
    expect(found.role).toBe('ADMIN');
  });

  it('deletes a user', async () => {
    await client().graphql({ query: deleteUser, variables: { input: { id: userId } } });

    const result = await client().graphql({ query: getUser, variables: { id: userId } });
    expect((result as any).data.getUser).toBeNull();
  });
});

describe('Comment', () => {
  const client = () => generateClient();
  let commentProductId: string;
  let commentId: string;

  beforeAll(async () => {
    const currentUser = await getCurrentUser();
    const result = await client().graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword: `Comment Test Product ${Date.now()}`,
          price: 10,
          category: 'Test',
          stock: 5,
          createdBy: currentUser.userId,
          updatedBy: currentUser.userId,
        },
      },
    });
    commentProductId = (result as any).data.createProduct.id;
  });

  it('creates a comment with correct fields', async () => {
    const currentUser = await getCurrentUser();
    const content = `Test comment at ${new Date().toISOString()}`;
    const input = {
      productId: commentProductId,
      authorId: currentUser.userId,
      authorName: currentUser.signInDetails?.loginId || 'Test User',
      content,
    };

    const result = await client().graphql({ query: createComment, variables: { input } });
    const comment = (result as any).data.createComment;
    commentId = comment.id;

    expect(typeof comment.id).toBe('string');
    expect(comment.id.length).toBeGreaterThan(0);
    expect(comment.productId).toBe(commentProductId);
    expect(comment.authorId).toBe(currentUser.userId);
    expect(comment.content).toBe(content);
  });

  it('reads a comment by id', async () => {
    const result = await client().graphql({ query: getComment, variables: { id: commentId } });
    const comment = (result as any).data.getComment;

    expect(comment).not.toBeNull();
    expect(comment.id).toBe(commentId);
    expect(comment.productId).toBe(commentProductId);
  });

  it('updates a comment and persists changes', async () => {
    const updatedContent = `Updated comment at ${new Date().toISOString()}`;
    await client().graphql({
      query: updateComment,
      variables: { input: { id: commentId, content: updatedContent } },
    });

    const result = await client().graphql({ query: getComment, variables: { id: commentId } });
    const comment = (result as any).data.getComment;

    expect(comment.content).toBe(updatedContent);
  });

  it('queries comments by productId', async () => {
    const result = await client().graphql({
      query: commentsByProductId,
      variables: { productId: commentProductId },
    });
    const items = (result as any).data.commentsByProductId.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((c: any) => c.id === commentId);
    expect(found).toBeDefined();
    expect(found.productId).toBe(commentProductId);
  });

  it('lists comments including the created one', async () => {
    const result = await client().graphql({ query: listComments });
    const items = (result as any).data.listComments.items;

    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThanOrEqual(1);
    const found = items.find((c: any) => c.id === commentId);
    expect(found).toBeDefined();
  });

  it('deletes a comment', async () => {
    await client().graphql({ query: deleteComment, variables: { input: { id: commentId } } });

    const result = await client().graphql({ query: getComment, variables: { id: commentId } });
    expect((result as any).data.getComment).toBeNull();
  });
});

describe('checkLowStock Lambda', () => {
  const client = () => generateClient();

  it('returns a message and lowStockProducts array', async () => {
    const result = await client().graphql({ query: checkLowStock });
    const data = (result as any).data.checkLowStock;

    expect(data).toBeDefined();
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
    expect(Array.isArray(data.lowStockProducts)).toBe(true);
  });
});

describe('S3 Storage', () => {
  let imageKey: string;

  it('uploads data with a key', async () => {
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const imageBuffer = Buffer.from(testImageBase64, 'base64');
    const fileName = `test-image-${Date.now()}.png`;

    const result = await uploadData({
      key: fileName,
      data: imageBuffer,
      options: { contentType: 'image/png' },
    }).result;

    imageKey = result.key;

    expect(typeof result.key).toBe('string');
    expect(result.key).toBe(fileName);
  });

  it('gets a signed URL for an uploaded key', async () => {
    const result = await getUrl({
      key: imageKey,
      options: { expiresIn: 3600 },
    });

    expect(result.url).toBeDefined();
    const urlStr = result.url.toString();
    expect(urlStr.length).toBeGreaterThan(0);
    expect(urlStr).toContain('http');
  });
});
