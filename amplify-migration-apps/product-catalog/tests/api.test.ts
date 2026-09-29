/* eslint-disable @typescript-eslint/no-explicit-any */
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser, signIn, signOut } from 'aws-amplify/auth';
import {
  getProduct,
  listProducts,
  getUser,
  listUsers,
  getComment,
  listComments,
  commentsByProductId,
  checkLowStock,
} from '../src/graphql/queries';
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
} from '../src/graphql/mutations';
import { UserRole } from '../src/API';
import { signUp, configureAmplify } from './signup';

const guest = () => generateClient({ authMode: 'apiKey' });
const iam = () => generateClient();
const userPool = () => generateClient({ authMode: 'userPool' });

beforeAll(async () => {
  const config = configureAmplify();
  const creds = await signUp(config);
  await signIn({ username: creds.username, password: creds.password });
}, 60_000);

afterAll(async () => {
  await signOut();
});

describe('guest', () => {
  it('cannot list products', async () => {
    await expect(guest().graphql({ query: listProducts })).rejects.toBeDefined();
  });

  it('cannot list users', async () => {
    await expect(guest().graphql({ query: listUsers })).rejects.toBeDefined();
  });

  it('cannot list comments', async () => {
    await expect(guest().graphql({ query: listComments })).rejects.toBeDefined();
  });
});

describe('iam', () => {
  describe('Product', () => {
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

      const result = await iam().graphql({ query: createProduct, variables: { input } });
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
      const result = await iam().graphql({ query: getProduct, variables: { id: productId } });
      const product = (result as any).data.getProduct;

      expect(product).not.toBeNull();
      expect(product.id).toBe(productId);
      expect(product.category).toBe('Electronics');
      expect(product.stock).toBe(50);
    });

    it('updates a product and persists changes', async () => {
      const currentUser = await getCurrentUser();
      await iam().graphql({
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

      const result = await iam().graphql({ query: getProduct, variables: { id: productId } });
      const product = (result as any).data.getProduct;

      expect(product.engword).toBe('Updated Test Product');
      expect(product.price).toBe(149.99);
      expect(product.stock).toBe(75);
      expect(product.updatedBy).toBe(currentUser.userId);
    });

    it('deletes a product', async () => {
      await iam().graphql({ query: deleteProduct, variables: { input: { id: productId } } });

      const result = await iam().graphql({ query: getProduct, variables: { id: productId } });
      expect((result as any).data.getProduct).toBeNull();
    });

    it('lists products', async () => {
      const currentUser = await getCurrentUser();
      const createResult = await iam().graphql({
        query: createProduct,
        variables: {
          input: {
            serialno: Math.floor(Math.random() * 10000),
            engword: `List Test ${Date.now()}`,
            price: 10,
            category: 'Test',
            stock: 1,
            createdBy: currentUser.userId,
            updatedBy: currentUser.userId,
          },
        },
      });
      const created = (createResult as any).data.createProduct;

      const result = await iam().graphql({ query: listProducts, variables: { limit: 1000 } });
      const items = (result as any).data.listProducts.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((p: any) => p.id === created.id);
      expect(found).toBeDefined();
      expect(found.engword).toBe(created.engword);
    });
  });

  describe('User', () => {
    let userId: string;

    it('creates a user with correct fields', async () => {
      userId = `test-user-${Date.now()}`;
      const input = {
        id: userId,
        email: `testuser${Date.now()}@example.com`,
        name: `Test User ${Date.now()}`,
        role: UserRole.VIEWER,
      };

      const result = await iam().graphql({ query: createUser, variables: { input } });
      const user = (result as any).data.createUser;

      expect(user.id).toBe(userId);
      expect(user.email).toBe(input.email);
      expect(user.name).toBe(input.name);
      expect(user.role).toBe('VIEWER');
    });

    it('reads a user by id', async () => {
      const result = await iam().graphql({ query: getUser, variables: { id: userId } });
      const user = (result as any).data.getUser;

      expect(user).not.toBeNull();
      expect(user.id).toBe(userId);
      expect(user.role).toBe('VIEWER');
    });

    it('updates user role from VIEWER to MANAGER', async () => {
      await iam().graphql({ query: updateUser, variables: { input: { id: userId, role: UserRole.MANAGER } } });

      const result = await iam().graphql({ query: getUser, variables: { id: userId } });
      const user = (result as any).data.getUser;

      expect(user.role).toBe('MANAGER');
    });

    it('updates user role from MANAGER to ADMIN', async () => {
      await iam().graphql({ query: updateUser, variables: { input: { id: userId, role: UserRole.ADMIN } } });

      const result = await iam().graphql({ query: getUser, variables: { id: userId } });
      const user = (result as any).data.getUser;

      expect(user.role).toBe('ADMIN');
    });

    it('deletes a user', async () => {
      await iam().graphql({ query: deleteUser, variables: { input: { id: userId } } });

      const result = await iam().graphql({ query: getUser, variables: { id: userId } });
      expect((result as any).data.getUser).toBeNull();
    });

    it('lists users', async () => {
      const listUserId = `list-user-${Date.now()}`;
      await iam().graphql({
        query: createUser,
        variables: { input: { id: listUserId, email: `list${Date.now()}@example.com`, name: 'List User', role: UserRole.VIEWER } },
      });

      const result = await iam().graphql({ query: listUsers, variables: { limit: 1000 } });
      const items = (result as any).data.listUsers.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((u: any) => u.id === listUserId);
      expect(found).toBeDefined();
    });
  });

  describe('Comment', () => {
    let commentProductId: string;
    let commentId: string;

    beforeAll(async () => {
      const currentUser = await getCurrentUser();
      const result = await iam().graphql({
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

      const result = await iam().graphql({ query: createComment, variables: { input } });
      const comment = (result as any).data.createComment;
      commentId = comment.id;

      expect(typeof comment.id).toBe('string');
      expect(comment.id.length).toBeGreaterThan(0);
      expect(comment.productId).toBe(commentProductId);
      expect(comment.authorId).toBe(currentUser.userId);
      expect(comment.content).toBe(content);
    });

    it('reads a comment by id', async () => {
      const result = await iam().graphql({ query: getComment, variables: { id: commentId } });
      const comment = (result as any).data.getComment;

      expect(comment).not.toBeNull();
      expect(comment.id).toBe(commentId);
      expect(comment.productId).toBe(commentProductId);
    });

    it('updates a comment and persists changes', async () => {
      const updatedContent = `Updated comment at ${new Date().toISOString()}`;
      await iam().graphql({
        query: updateComment,
        variables: { input: { id: commentId, content: updatedContent } },
      });

      const result = await iam().graphql({ query: getComment, variables: { id: commentId } });
      const comment = (result as any).data.getComment;

      expect(comment.content).toBe(updatedContent);
    });

    it('queries comments by productId', async () => {
      const result = await iam().graphql({
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

    it('deletes a comment', async () => {
      await iam().graphql({ query: deleteComment, variables: { input: { id: commentId } } });

      const result = await iam().graphql({ query: getComment, variables: { id: commentId } });
      expect((result as any).data.getComment).toBeNull();
    });

    it('lists comments', async () => {
      const currentUser = await getCurrentUser();
      const createResult = await iam().graphql({
        query: createComment,
        variables: {
          input: {
            productId: commentProductId,
            authorId: currentUser.userId,
            authorName: currentUser.signInDetails?.loginId || 'Test User',
            content: `List comment ${Date.now()}`,
          },
        },
      });
      const created = (createResult as any).data.createComment;

      const result = await iam().graphql({ query: listComments, variables: { limit: 1000 } });
      const items = (result as any).data.listComments.items;

      expect(Array.isArray(items)).toBe(true);
      expect(items.length).toBeGreaterThanOrEqual(1);
      const found = items.find((c: any) => c.id === created.id);
      expect(found).toBeDefined();
    });
  });

  it('checkLowStock returns message and lowStockProducts', async () => {
    const result = await iam().graphql({ query: checkLowStock });
    const data = (result as any).data.checkLowStock;

    expect(data).toBeDefined();
    expect(typeof data.message).toBe('string');
    expect(data.message.length).toBeGreaterThan(0);
    expect(data.message).toContain('e2e-test-secret-value');
    expect(Array.isArray(data.lowStockProducts)).toBe(true);
  });
});

describe('userPool', () => {
  it('can create and read own User record', async () => {
    const currentUser = await getCurrentUser();
    const input = {
      id: currentUser.userId,
      email: `up-${Date.now()}@example.com`,
      name: 'UserPool Test',
      role: UserRole.VIEWER,
    };

    const result = await userPool().graphql({ query: createUser, variables: { input } });
    const user = (result as any).data.createUser;
    expect(user.id).toBe(currentUser.userId);

    const getResult = await userPool().graphql({ query: getUser, variables: { id: currentUser.userId } });
    expect((getResult as any).data.getUser.name).toBe('UserPool Test');
  });

  it('cannot list products', async () => {
    await expect(userPool().graphql({ query: listProducts })).rejects.toBeDefined();
  });
});
