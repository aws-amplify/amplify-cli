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
} from './src/graphql/queries';
import {
  createProduct, updateProduct, deleteProduct,
  createUser, updateUser, deleteUser,
  createComment, updateComment, deleteComment,
} from './src/graphql/mutations';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}


async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  Amplify.configure(config);

  const { username, password } = await signUp(config);

  await signIn({ username, password });

  const currentUser = await getCurrentUser();

  console.log('')
  console.log('='.repeat(60));
  console.log('📖 GraphQL Queries (Products, Users, Comments, Low Stock)');
  console.log('='.repeat(60));
  console.log('')

  const existingProductId = await testListProducts();
  if (existingProductId) await testGetProduct(existingProductId);
  const existingUserId = await testListUsers();
  if (existingUserId) await testGetUser(existingUserId);
  await testListComments();
  if (existingProductId) await testCommentsByProductId(existingProductId);
  await testCheckLowStock();

  console.log('')
  console.log('='.repeat(60));
  console.log('📦 Product CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const testProductId = await testCreateProduct(currentUser.userId);
  if (testProductId) await testUpdateProduct(testProductId, currentUser.userId);

  console.log('')
  console.log('='.repeat(60));
  console.log('👥 User CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const testUserId = await testCreateUser();
  if (testUserId) {
    await testUpdateUserRole(testUserId, 'MANAGER');
    await testUpdateUserRole(testUserId, 'ADMIN');
    await testDeleteUser(testUserId);
  }

  console.log('')
  console.log('='.repeat(60));
  console.log('💬 Comment CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const productForComments = testProductId || existingProductId;
  if (productForComments) {
    const testCommentId = await testCreateComment(productForComments, currentUser.userId);
    if (testCommentId) {
      await testUpdateComment(testCommentId);
      await testDeleteComment(testCommentId);
    }
  } else {
    console.log('⚠️ Skipping comment tests - no product available');
  }

  console.log('')
  console.log('='.repeat(60));
  console.log('📸 S3 Storage Operations');
  console.log('='.repeat(60));
  console.log('')

  const imageKey = await testUploadProductImage();
  if (imageKey) await testGetImageUrl(imageKey);

  console.log('')
  console.log('='.repeat(60));
  console.log('🧹 Cleanup');
  console.log('='.repeat(60));
  console.log('')

  if (testProductId) await testDeleteProduct(testProductId);

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


// ============================================================
// Query Tests
// ============================================================

async function testListProducts(): Promise<string | null> {
  console.log('📋 Testing listProducts...');
  const client = generateClient();
  const result = await client.graphql({ query: listProducts });
  const products = (result as any).data.listProducts.items;
  console.log(`✅ Found ${products.length} products`);
  products
    .slice(0, 5)
    .forEach((p: any) => console.log(`   - [${p.id.substring(0, 8)}...] ${p.engword} | ${p.price || 'N/A'} | Stock: ${p.stock || 0}`));
  if (products.length > 5) console.log(`   ... and ${products.length - 5} more`);
  return products.length > 0 ? products[0].id : null;
}

async function testGetProduct(id: string): Promise<void> {
  console.log(`🔍 Testing getProduct (id: ${id.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: getProduct, variables: { id } });
  const product = (result as any).data.getProduct;
  console.log('✅ Product:', product.engword, '| Price:', product.price, '| Stock:', product.stock);
}

async function testListUsers(): Promise<string | null> {
  console.log('👥 Testing listUsers...');
  const client = generateClient();
  const result = await client.graphql({ query: listUsers });
  const users = (result as any).data.listUsers.items;
  console.log(`✅ Found ${users.length} users`);
  users.forEach((u: any) => console.log(`   - [${u.role}] ${u.name} (${u.email})`));
  return users.length > 0 ? users[0].id : null;
}

async function testGetUser(id: string): Promise<void> {
  console.log(`🔍 Testing getUser (id: ${id.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: getUser, variables: { id } });
  const user = (result as any).data.getUser;
  console.log('✅ User:', user.name, '| Role:', user.role);
}

async function testListComments(): Promise<void> {
  console.log('💬 Testing listComments...');
  const client = generateClient();
  const result = await client.graphql({ query: listComments });
  const comments = (result as any).data.listComments.items;
  console.log(`✅ Found ${comments.length} comments`);
  comments
    .slice(0, 5)
    .forEach((c: any) => console.log(`   - [${c.authorName}] "${c.content.substring(0, 50)}${c.content.length > 50 ? '...' : ''}"`));
}

async function testCommentsByProductId(productId: string): Promise<void> {
  console.log(`💬 Testing commentsByProductId (productId: ${productId.substring(0, 8)}...)...`);
  const client = generateClient();
  const result = await client.graphql({ query: commentsByProductId, variables: { productId } });
  const comments = (result as any).data.commentsByProductId.items;
  console.log(`✅ Found ${comments.length} comments for this product`);
}

async function testCheckLowStock(): Promise<void> {
  console.log('⚠️ Testing checkLowStock (Lambda function)...');
  const client = generateClient();
  const result = await client.graphql({ query: checkLowStock });
  const data = (result as any).data.checkLowStock;
  console.log(`✅ ${data.message}`);
  if (data.lowStockProducts && data.lowStockProducts.length > 0) {
    data.lowStockProducts.forEach((p: any) => console.log(`   - ${p.name}: ${p.stock} remaining`));
  }
}


// ============================================================
// Product Mutation Tests
// ============================================================

async function testCreateProduct(userId: string): Promise<string | null> {
  console.log('🆕 Testing createProduct...');
  const client = generateClient();
  const result = await client.graphql({
    query: createProduct,
    variables: {
      input: {
        serialno: Math.floor(Math.random() * 10000),
        engword: `Test Product ${Date.now()}`,
        price: 99.99,
        category: 'Electronics',
        description: 'Test product created by frontest',
        stock: 50,
        brand: 'TestBrand',
        createdBy: userId,
        updatedBy: userId,
      },
    },
  });
  const product = (result as any).data.createProduct;
  console.log('✅ Created product:', product.id.substring(0, 8) + '...');
  return product.id;
}

async function testUpdateProduct(productId: string, userId: string): Promise<void> {
  console.log(`✏️ Testing updateProduct (id: ${productId.substring(0, 8)}...)...`);
  const client = generateClient();
  await client.graphql({
    query: updateProduct,
    variables: {
      input: {
        id: productId,
        engword: 'Updated Test Product',
        price: 149.99,
        stock: 75,
        updatedBy: userId,
      },
    },
  });
  console.log('✅ Updated product');
}

async function testDeleteProduct(productId: string): Promise<void> {
  console.log(`🗑️ Testing deleteProduct (id: ${productId.substring(0, 8)}...)...`);
  const client = generateClient();
  await client.graphql({
    query: deleteProduct,
    variables: { input: { id: productId } },
  });
  console.log('✅ Deleted product');
}


// ============================================================
// User Mutation Tests
// ============================================================

async function testCreateUser(): Promise<string | null> {
  console.log('🆕 Testing createUser...');
  const client = generateClient();
  const testUserId = `test-user-${Date.now()}`;
  const result = await client.graphql({
    query: createUser,
    variables: {
      input: {
        id: testUserId,
        email: `testuser${Date.now()}@example.com`,
        name: `Test User ${Date.now()}`,
        role: 'VIEWER',
      },
    },
  });
  const user = (result as any).data.createUser;
  console.log('✅ Created user:', user.id.substring(0, 8) + '...');
  return user.id;
}

async function testUpdateUserRole(userId: string, newRole: string): Promise<void> {
  console.log(`✏️ Testing updateUser role (id: ${userId.substring(0, 8)}..., newRole: ${newRole})...`);
  const client = generateClient();
  await client.graphql({
    query: updateUser,
    variables: { input: { id: userId, role: newRole } },
  });
  console.log('✅ Updated user role');
}

async function testDeleteUser(userId: string): Promise<void> {
  console.log(`🗑️ Testing deleteUser (id: ${userId.substring(0, 8)}...)...`);
  const client = generateClient();
  await client.graphql({
    query: deleteUser,
    variables: { input: { id: userId } },
  });
  console.log('✅ Deleted user');
}


// ============================================================
// Comment Mutation Tests
// ============================================================

async function testCreateComment(productId: string, userId: string): Promise<string | null> {
  console.log(`🆕 Testing createComment (productId: ${productId.substring(0, 8)}...)...`);
  const client = generateClient();
  const currentUser = await getCurrentUser();
  const result = await client.graphql({
    query: createComment,
    variables: {
      input: {
        productId,
        authorId: userId,
        authorName: currentUser.signInDetails?.loginId || 'Test User',
        content: `Test comment at ${new Date().toISOString()}`,
      },
    },
  });
  const comment = (result as any).data.createComment;
  console.log('✅ Created comment:', comment.id.substring(0, 8) + '...');
  return comment.id;
}

async function testUpdateComment(commentId: string): Promise<void> {
  console.log(`✏️ Testing updateComment (id: ${commentId.substring(0, 8)}...)...`);
  const client = generateClient();
  await client.graphql({
    query: updateComment,
    variables: {
      input: { id: commentId, content: `Updated comment at ${new Date().toISOString()}` },
    },
  });
  console.log('✅ Updated comment');
}

async function testDeleteComment(commentId: string): Promise<void> {
  console.log(`🗑️ Testing deleteComment (id: ${commentId.substring(0, 8)}...)...`);
  const client = generateClient();
  await client.graphql({
    query: deleteComment,
    variables: { input: { id: commentId } },
  });
  console.log('✅ Deleted comment');
}


// ============================================================
// S3 Storage Tests
// ============================================================

async function testUploadProductImage(): Promise<string | null> {
  console.log('📤 Testing uploadData (S3 image upload)...');
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const fileName = `test-image-${Date.now()}.png`;

  const result = await uploadData({
    key: fileName,
    data: imageBuffer,
    options: { contentType: 'image/png' },
  }).result;

  console.log('✅ Upload successful! Key:', result.key);
  return result.key;
}

async function testGetImageUrl(imageKey: string): Promise<void> {
  console.log('🔗 Testing getUrl (S3 signed URL)...');
  const result = await getUrl({
    key: imageKey,
    options: { expiresIn: 3600 },
  });
  console.log('✅ Got signed URL:', result.url.toString().substring(0, 80) + '...');
}


// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Product catalog app uses email-based auth
  const email = generateTestEmail();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: email,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: email },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: email,
    Password: password,
    Permanent: true,
  }));

  return { username: email, password };
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
