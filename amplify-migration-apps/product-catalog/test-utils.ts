// test-utils.ts
/**
 * Shared test utilities for Product Catalog Gen1 and Gen2 test scripts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { uploadData, getUrl } from 'aws-amplify/storage';
import { getCurrentUser } from 'aws-amplify/auth';
import * as fs from 'fs';

// Import GraphQL queries and mutations
import { getProduct, listProducts, getUser, listUsers, listComments, commentsByProductId, checkLowStock } from './src/graphql/queries';

import {
  createProduct,
  updateProduct,
  deleteProduct,
  createUser,
  updateUser,
  deleteUser,
  createComment,
  updateComment,
  deleteComment,
} from './src/graphql/mutations';

import { UserRole } from './src/API';
import { TestRunner } from '../_test-common/test-apps-test-utils';
import amplifyconfig from './src/amplifyconfiguration.json';

// Configure Amplify in this module to ensure api/storage singletons see the config
Amplify.configure(amplifyconfig);

// ============================================================
// Shared Test Functions Factory
// ============================================================

export function createTestFunctions() {
  const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other'];

  function getAuthClient() {
    return generateClient();
  }

  // ============================================================
  // PART 1: GraphQL Query Tests
  // ============================================================

  async function testListProducts(): Promise<string | null> {
    console.log('\n📦 Testing listProducts...');
    const client = getAuthClient();

    const result = await client.graphql({ query: listProducts });
    const products = (result as any).data.listProducts.items;
    console.log(`✅ Found ${products.length} products:`);
    products
      .slice(0, 5)
      .forEach((p: any) => console.log(`   - [${p.id.substring(0, 8)}...] ${p.engword} | ${p.price || 'N/A'} | Stock: ${p.stock || 0}`));
    if (products.length > 5) console.log(`   ... and ${products.length - 5} more`);
    return products.length > 0 ? products[0].id : null;
  }

  async function testGetProduct(id: string): Promise<void> {
    console.log(`\n🔍 Testing getProduct (id: ${id.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: getProduct,
      variables: { id },
    });
    const product = (result as any).data.getProduct;
    console.log('✅ Product details:', {
      id: product.id,
      name: product.engword,
      serialno: product.serialno,
      price: product.price,
      category: product.category,
      stock: product.stock,
      brand: product.brand,
    });
  }

  async function testListUsers(): Promise<string | null> {
    console.log('\n👥 Testing listUsers...');
    const client = getAuthClient();

    const result = await client.graphql({ query: listUsers });
    const users = (result as any).data.listUsers.items;
    console.log(`✅ Found ${users.length} users:`);
    users.forEach((u: any) => console.log(`   - [${u.role}] ${u.name} (${u.email})`));
    return users.length > 0 ? users[0].id : null;
  }

  async function testGetUser(id: string): Promise<void> {
    console.log(`\n🔍 Testing getUser (id: ${id.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: getUser,
      variables: { id },
    });
    const user = (result as any).data.getUser;
    console.log('✅ User details:', user);
  }

  async function testListComments(): Promise<string | null> {
    console.log('\n💬 Testing listComments...');
    const client = getAuthClient();

    const result = await client.graphql({ query: listComments });
    const comments = (result as any).data.listComments.items;
    console.log(`✅ Found ${comments.length} comments:`);
    comments
      .slice(0, 5)
      .forEach((c: any) => console.log(`   - [${c.authorName}] "${c.content.substring(0, 50)}${c.content.length > 50 ? '...' : ''}"`));
    return comments.length > 0 ? comments[0].id : null;
  }

  async function testCommentsByProductId(productId: string): Promise<void> {
    console.log(`\n💬 Testing commentsByProductId (productId: ${productId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: commentsByProductId,
      variables: { productId },
    });
    const comments = (result as any).data.commentsByProductId.items;
    console.log(`✅ Found ${comments.length} comments for this product:`);
    comments.forEach((c: any) => console.log(`   - [${c.authorName}] "${c.content}"`));
  }

  async function testCheckLowStock(): Promise<void> {
    console.log('\n⚠️ Testing checkLowStock (Lambda function)...');
    const client = getAuthClient();

    const result = await client.graphql({ query: checkLowStock });
    const data = (result as any).data.checkLowStock;
    console.log('✅ Low stock check result:');
    console.log(`   Message: ${data.message}`);
    if (data.lowStockProducts && data.lowStockProducts.length > 0) {
      console.log(`   Low stock products (${data.lowStockProducts.length}):`);
      data.lowStockProducts.forEach((p: any) => console.log(`   - ${p.name}: ${p.stock} remaining`));
    } else {
      console.log('   All products are well stocked!');
    }
  }

  // ============================================================
  // PART 2: Product Mutation Tests
  // ============================================================

  async function testCreateProduct(): Promise<string | null> {
    console.log('\n🆕 Testing createProduct...');
    const client = getAuthClient();

    const authUser = await getCurrentUser();
    const result = await client.graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword: `Test Product ${Date.now()}`,
          price: 99.99,
          category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
          description: 'This is a test product created by the test script',
          stock: 50,
          brand: 'TestBrand',
          createdBy: authUser.userId,
          updatedBy: authUser.userId,
        },
      },
    });
    const product = (result as any).data.createProduct;
    console.log('✅ Created product:', {
      id: product.id,
      name: product.engword,
      serialno: product.serialno,
      price: product.price,
      category: product.category,
      stock: product.stock,
    });
    return product.id;
  }

  async function testUpdateProduct(productId: string): Promise<void> {
    console.log(`\n✏️ Testing updateProduct (id: ${productId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const authUser = await getCurrentUser();
    const result = await client.graphql({
      query: updateProduct,
      variables: {
        input: {
          id: productId,
          engword: 'Updated Test Product',
          description: 'This product was updated by the test script',
          price: 149.99,
          stock: 75,
          updatedBy: authUser.userId,
        },
      },
    });
    const product = (result as any).data.updateProduct;
    console.log('✅ Updated product:', {
      id: product.id,
      name: product.engword,
      price: product.price,
      stock: product.stock,
    });
  }

  async function testDeleteProduct(productId: string): Promise<void> {
    console.log(`\n🗑️ Testing deleteProduct (id: ${productId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: deleteProduct,
      variables: { input: { id: productId } },
    });
    const deleted = (result as any).data.deleteProduct;
    console.log('✅ Deleted product:', deleted.engword);
  }

  // ============================================================
  // PART 3: User Mutation Tests
  // ============================================================

  async function testCreateUser(): Promise<string | null> {
    console.log('\n🆕 Testing createUser...');
    const client = getAuthClient();

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
    console.log('✅ Created user:', {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });
    return user.id;
  }

  async function testUpdateUserRole(userId: string, newRole: UserRole): Promise<void> {
    console.log(`\n✏️ Testing updateUser role (id: ${userId.substring(0, 8)}..., newRole: ${newRole})...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: updateUser,
      variables: {
        input: {
          id: userId,
          role: newRole,
        },
      },
    });
    const user = (result as any).data.updateUser;
    console.log('✅ Updated user role:', {
      id: user.id,
      name: user.name,
      role: user.role,
    });
  }

  async function testDeleteUser(userId: string): Promise<void> {
    console.log(`\n🗑️ Testing deleteUser (id: ${userId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: deleteUser,
      variables: { input: { id: userId } },
    });
    const deleted = (result as any).data.deleteUser;
    console.log('✅ Deleted user:', deleted.email);
  }

  // ============================================================
  // PART 4: Comment Mutation Tests
  // ============================================================

  async function testCreateComment(productId: string): Promise<string | null> {
    console.log(`\n🆕 Testing createComment (productId: ${productId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const authUser = await getCurrentUser();
    const result = await client.graphql({
      query: createComment,
      variables: {
        input: {
          productId,
          authorId: authUser.userId,
          authorName: authUser.signInDetails?.loginId || 'Test User',
          content: `Test comment created at ${new Date().toISOString()}`,
        },
      },
    });
    const comment = (result as any).data.createComment;
    console.log('✅ Created comment:', {
      id: comment.id,
      productId: comment.productId,
      authorName: comment.authorName,
      content: comment.content,
    });
    return comment.id;
  }

  async function testUpdateComment(commentId: string): Promise<void> {
    console.log(`\n✏️ Testing updateComment (id: ${commentId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: updateComment,
      variables: {
        input: {
          id: commentId,
          content: `Updated comment at ${new Date().toISOString()}`,
        },
      },
    });
    const comment = (result as any).data.updateComment;
    console.log('✅ Updated comment:', {
      id: comment.id,
      content: comment.content,
    });
  }

  async function testDeleteComment(commentId: string): Promise<void> {
    console.log(`\n🗑️ Testing deleteComment (id: ${commentId.substring(0, 8)}...)...`);
    const client = getAuthClient();

    const result = await client.graphql({
      query: deleteComment,
      variables: { input: { id: commentId } },
    });
    const deleted = (result as any).data.deleteComment;
    console.log('✅ Deleted comment:', deleted.content?.substring(0, 30) + '...');
  }

  // ============================================================
  // PART 5: S3 Storage Operations Tests
  // ============================================================

  async function testUploadProductImage(productId?: string): Promise<string | null> {
    console.log('\n📤 Testing uploadData (S3 image upload)...');

    // Try to use local image file, fallback to generated image
    const localImagePath = './test-image.jpg';
    let imageBuffer: Buffer;
    let contentType: string;
    let fileExt: string;

    if (fs.existsSync(localImagePath)) {
      imageBuffer = fs.readFileSync(localImagePath);
      contentType = 'image/jpeg';
      fileExt = 'jpg';
      console.log('   Using local image file');
    } else {
      // Fallback: create a simple test image (100x100 gray square PNG)
      const testImageBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAA3klEQVR42u3QMQEAAAgDILV/51nBzwci0JlYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqz8WgGPGAGBPQqrHAAAAABJRU5ErkJggg==';
      imageBuffer = Buffer.from(testImageBase64, 'base64');
      contentType = 'image/png';
      fileExt = 'png';
      console.log('   Using generated test image');
    }

    const fileName = `test-image-${Date.now()}.${fileExt}`;
    const s3Key = productId ? `products/${productId}_${Date.now()}-${fileName}` : `products/test_${Date.now()}-${fileName}`;

    console.log(`   Uploading to: ${s3Key}`);
    console.log(`   File size: ${imageBuffer.length} bytes`);

    const result = await uploadData({
      key: s3Key,
      data: imageBuffer,
      options: { contentType },
    }).result;

    console.log('✅ Upload successful!');
    console.log('   Key:', result.key);
    return result.key;
  }

  async function testGetImageUrl(imageKey: string): Promise<string | null> {
    console.log(`\n🔗 Testing getUrl (S3 signed URL)...`);
    console.log(`   Image key: ${imageKey}`);

    const result = await getUrl({
      key: imageKey,
      options: { expiresIn: 3600 },
    });
    console.log('✅ Got signed URL!');
    console.log('   URL:', result.url.toString().substring(0, 80) + '...');
    console.log('   Expires at:', result.expiresAt);
    return result.url.toString();
  }

  async function testCreateProductWithImage(): Promise<{ productId: string | null; imageKey: string | null }> {
    console.log('\n📦 Testing full product creation with image upload...');
    const client = getAuthClient();

    const authUser = await getCurrentUser();

    // Step 1: Create product
    console.log('   Step 1: Creating product...');
    const createResult = await client.graphql({
      query: createProduct,
      variables: {
        input: {
          serialno: Math.floor(Math.random() * 10000),
          engword: `Product With Image ${Date.now()}`,
          price: 199.99,
          category: 'Electronics',
          description: 'Test product with image upload',
          stock: 25,
          brand: 'TestBrand',
          createdBy: authUser.userId,
          updatedBy: authUser.userId,
        },
      },
    });
    const product = (createResult as any).data.createProduct;
    console.log(`   ✅ Product created: ${product.id}`);

    // Step 2: Upload image
    console.log('   Step 2: Uploading image...');
    const imageKey = await testUploadProductImage(product.id);

    if (imageKey) {
      // Step 3: Update product with imageKey
      console.log('   Step 3: Updating product with imageKey...');
      await client.graphql({
        query: updateProduct,
        variables: {
          input: {
            id: product.id,
            imageKey: imageKey,
            updatedBy: authUser.userId,
          },
        },
      });
      console.log('   ✅ Product updated with imageKey');
    }

    console.log('✅ Full product with image creation complete!');
    return { productId: product.id, imageKey };
  }

  // ============================================================
  // PART 6: Role-Based Access Control Tests
  // ============================================================

  async function testRoleBasedPermissions(): Promise<void> {
    console.log('\n🔒 Testing Role-Based Access Control...');
    const client = getAuthClient();
    const authUser = await getCurrentUser();

    const userResult = await client.graphql({
      query: getUser,
      variables: { id: authUser.userId },
    });
    const currentUser = (userResult as any).data.getUser;

    if (!currentUser) {
      console.log('   ⚠️ User not found in database.');
      return;
    }

    const role = currentUser.role;
    console.log(`   Current user role: ${role}`);

    // Define expected permissions based on role
    const permissions = {
      canCreate: role === 'ADMIN' || role === 'MANAGER',
      canEdit: role === 'ADMIN' || role === 'MANAGER',
      canDelete: role === 'ADMIN',
      canManageUsers: role === 'ADMIN',
    };

    console.log('   Expected permissions:');
    console.log(`   - Can Create Products: ${permissions.canCreate ? '✅' : '❌'}`);
    console.log(`   - Can Edit Products: ${permissions.canEdit ? '✅' : '❌'}`);
    console.log(`   - Can Delete Products: ${permissions.canDelete ? '✅' : '❌'}`);
    console.log(`   - Can Manage Users: ${permissions.canManageUsers ? '✅' : '❌'}`);
  }

  // ============================================================
  // PART 7: Business Logic Tests
  // ============================================================

  async function testProductFiltering(): Promise<void> {
    console.log('\n🔍 Testing product filtering logic...');
    const client = getAuthClient();

    const result = await client.graphql({ query: listProducts });
    const products = (result as any).data.listProducts.items;

    if (products.length === 0) {
      console.log('   ⚠️ No products to filter');
      return;
    }

    // Test search filter (by name)
    const searchTerm = products[0].engword.substring(0, 3).toLowerCase();
    const searchFiltered = products.filter((p: any) => p.engword.toLowerCase().includes(searchTerm));
    console.log(`   Search filter "${searchTerm}": ${searchFiltered.length} results`);

    // Test category filter
    const categories = [...new Set(products.map((p: any) => p.category).filter(Boolean))];
    if (categories.length > 0) {
      const categoryFiltered = products.filter((p: any) => p.category === categories[0]);
      console.log(`   Category filter "${categories[0]}": ${categoryFiltered.length} results`);
    }

    // Test sorting
    const sortedByName = [...products].sort((a: any, b: any) => a.engword.localeCompare(b.engword));
    const sortedByPrice = [...products].sort((a: any, b: any) => (a.price || 0) - (b.price || 0));
    const sortedByStock = [...products].sort((a: any, b: any) => (a.stock || 0) - (b.stock || 0));

    console.log('   ✅ Sorting tests:');
    console.log(`      By name: First="${sortedByName[0]?.engword}", Last="${sortedByName[sortedByName.length - 1]?.engword}"`);
    console.log(`      By price: Min=${sortedByPrice[0]?.price || 0}, Max=${sortedByPrice[sortedByPrice.length - 1]?.price || 0}`);
    console.log(`      By stock: Min=${sortedByStock[0]?.stock || 0}, Max=${sortedByStock[sortedByStock.length - 1]?.stock || 0}`);
  }

  async function testLowStockReportGeneration(): Promise<void> {
    console.log('\n📊 Testing low stock report generation...');
    const client = getAuthClient();

    const result = await client.graphql({ query: checkLowStock });
    const data = (result as any).data.checkLowStock;

    if (data?.lowStockProducts && data.lowStockProducts.length > 0) {
      // Generate CSV content (simulating downloadStockReport)
      const csvHeader = 'Product Name,Current Stock\n';
      const csvRows = data.lowStockProducts.map((p: any) => `"${p.name}",${p.stock}`).join('\n');
      const csvContent = csvHeader + csvRows;

      console.log('   ✅ CSV Report generated:');
      console.log('   ---');
      console.log(csvContent);
      console.log('   ---');
      console.log(`   Total low stock items: ${data.lowStockProducts.length}`);
    } else {
      console.log('   ✅ All products are well stocked - no report needed');
    }
  }

  return {
    testListProducts,
    testGetProduct,
    testListUsers,
    testGetUser,
    testListComments,
    testCommentsByProductId,
    testCheckLowStock,
    testCreateProduct,
    testUpdateProduct,
    testDeleteProduct,
    testCreateUser,
    testUpdateUserRole,
    testDeleteUser,
    testCreateComment,
    testUpdateComment,
    testDeleteComment,
    testUploadProductImage,
    testGetImageUrl,
    testCreateProductWithImage,
    testRoleBasedPermissions,
    testProductFiltering,
    testLowStockReportGeneration,
  };
}

// ============================================================
// Shared Test Orchestration Functions
// ============================================================

export function createTestOrchestrator(testFunctions: ReturnType<typeof createTestFunctions>, runner: TestRunner) {
  async function runQueryTests(): Promise<{ productId: string | null; userId: string | null }> {
    console.log('\n' + '='.repeat(60));
    console.log('📖 PART 1: GraphQL Queries');
    console.log('='.repeat(60));

    const productId = await runner.runTest('listProducts', testFunctions.testListProducts);
    if (productId) await runner.runTest('getProduct', () => testFunctions.testGetProduct(productId));

    const userId = await runner.runTest('listUsers', testFunctions.testListUsers);
    if (userId) await runner.runTest('getUser', () => testFunctions.testGetUser(userId));

    await runner.runTest('listComments', testFunctions.testListComments);
    if (productId) await runner.runTest('commentsByProductId', () => testFunctions.testCommentsByProductId(productId));

    await runner.runTest('checkLowStock', testFunctions.testCheckLowStock);

    return { productId, userId };
  }

  async function runProductMutationTests(): Promise<string | null> {
    console.log('\n' + '='.repeat(60));
    console.log('📦 PART 2: Product Mutations');
    console.log('='.repeat(60));

    const productId = await runner.runTest('createProduct', testFunctions.testCreateProduct);

    if (productId) {
      await runner.runTest('updateProduct', () => testFunctions.testUpdateProduct(productId));
    }

    return productId;
  }

  async function runUserMutationTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('👥 PART 3: User Mutations');
    console.log('='.repeat(60));

    const userId = await runner.runTest('createUser', testFunctions.testCreateUser);

    if (userId) {
      await runner.runTest('updateUserRole_MANAGER', () => testFunctions.testUpdateUserRole(userId, 'MANAGER'));
      await runner.runTest('updateUserRole_ADMIN', () => testFunctions.testUpdateUserRole(userId, 'ADMIN'));
      await runner.runTest('deleteUser', () => testFunctions.testDeleteUser(userId));
    }
  }

  async function runCommentMutationTests(productId: string): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('💬 PART 4: Comment Mutations');
    console.log('='.repeat(60));

    const commentId = await runner.runTest('createComment', () => testFunctions.testCreateComment(productId));

    if (commentId) {
      await runner.runTest('updateComment', () => testFunctions.testUpdateComment(commentId));
      await runner.runTest('deleteComment', () => testFunctions.testDeleteComment(commentId));
    }
  }

  async function runStorageTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📸 PART 5: S3 Storage Operations');
    console.log('='.repeat(60));

    const imageKey = await runner.runTest('uploadProductImage', testFunctions.testUploadProductImage);

    if (imageKey) {
      await runner.runTest('getImageUrl', () => testFunctions.testGetImageUrl(imageKey));
    }

    // Test full product creation with image
    const { productId, imageKey: newImageKey } = (await runner.runTest(
      'createProductWithImage',
      testFunctions.testCreateProductWithImage,
    )) || {
      productId: null,
      imageKey: null,
    };

    if (newImageKey) {
      await runner.runTest('getImageUrl_newProduct', () => testFunctions.testGetImageUrl(newImageKey));
    }

    // Cleanup: delete the test product
    if (productId) {
      await runner.runTest('deleteProduct_cleanup', () => testFunctions.testDeleteProduct(productId));
    }
  }

  async function runRBACTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🔒 PART 6: Role-Based Access Control Tests');
    console.log('='.repeat(60));

    await runner.runTest('roleBasedPermissions', testFunctions.testRoleBasedPermissions);
  }

  async function runBusinessLogicTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PART 7: Business Logic Tests');
    console.log('='.repeat(60));

    await runner.runTest('productFiltering', testFunctions.testProductFiltering);
    await runner.runTest('lowStockReportGeneration', testFunctions.testLowStockReportGeneration);
  }

  return {
    runQueryTests,
    runProductMutationTests,
    runUserMutationTests,
    runCommentMutationTests,
    runStorageTests,
    runRBACTests,
    runBusinessLogicTests,
  };
}
