/**
 * Consolidated Test Script for Project Boards App
 *
 * This script tests all functionality:
 * 1. Public GraphQL Queries (no auth required)
 * 2. Authenticated GraphQL Mutations (requires auth)
 * 3. S3 Storage Operations (requires auth)
 *
 * IMPORTANT: Update TEST_USER credentials before running authenticated tests.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { generateClient } from 'aws-amplify/api';
import { Amplify } from 'aws-amplify';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl, downloadData, getProperties } from 'aws-amplify/storage';
import * as fs from 'fs';
import amplifyconfig from './src/amplifyconfiguration.json';
import { getProject, getTodo, listProjects, listTodos } from './src/graphql/queries';
import { createProject, updateProject, deleteProject, createTodo, updateTodo, deleteTodo } from './src/graphql/mutations';
import { ProjectStatus } from './src/API';
import { createTestRunner } from './test-utils';

// Configure Amplify
Amplify.configure(amplifyconfig);

// Initialize test runner
const { runTest, printSummary } = createTestRunner();

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_USERNAME_HERE',
  password: 'YOUR_PASSWORD_HERE',
};

// Clients
const publicClient = generateClient({ authMode: 'apiKey' });

// Custom query for getRandomQuote (not in generated files)
const getRandomQuote = /* GraphQL */ `
  query GetRandomQuote {
    getRandomQuote {
      message
      quote
      author
      timestamp
      totalQuotes
    }
  }
`;

// ============================================================
// Authentication Helper Functions
// ============================================================

async function authenticateUser(): Promise<boolean> {
  console.log('\n🔐 Authenticating user...');
  try {
    await signIn({
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    const user = await getCurrentUser();
    console.log(`✅ Signed in as: ${user.username}`);
    return true;
  } catch (error: any) {
    if (error.name === 'UserAlreadyAuthenticatedException') {
      const user = await getCurrentUser();
      console.log(`✅ Already signed in as: ${user.username}`);
      return true;
    }
    console.log('❌ Authentication failed:', error.message || error);
    return false;
  }
}

async function signOutUser(): Promise<void> {
  console.log('\n🚪 Signing out...');
  try {
    await signOut();
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.log('❌ Sign out error:', error);
  }
}

// ============================================================
// Public Query Test Functions
// ============================================================

async function testGetRandomQuote() {
  console.log('\n📝 Testing getRandomQuote...');
  const result = await publicClient.graphql({ query: getRandomQuote });
  console.log('✅ Success:', (result as any).data.getRandomQuote);
}

async function testListProjects(): Promise<string | null> {
  console.log('\n📋 Testing listProjects...');
  const result = await publicClient.graphql({ query: listProjects });
  const projects = (result as any).data.listProjects.items;
  console.log(`✅ Found ${projects.length} projects:`);
  projects.forEach((p: any) => console.log(`   - [${p.id}] ${p.title} (${p.status})`));
  return projects.length > 0 ? projects[0].id : null;
}

async function testListTodos(): Promise<string | null> {
  console.log('\n✅ Testing listTodos...');
  const result = await publicClient.graphql({ query: listTodos });
  const todos = (result as any).data.listTodos.items;
  console.log(`✅ Found ${todos.length} todos:`);
  todos.forEach((t: any) => console.log(`   - [${t.id}] ${t.name}: ${t.description || '(no description)'}`));
  return todos.length > 0 ? todos[0].id : null;
}

async function testGetProject(id: string) {
  console.log(`\n🔍 Testing getProject (id: ${id})...`);
  const result = await publicClient.graphql({
    query: getProject,
    variables: { id },
  });
  console.log('✅ Project:', (result as any).data.getProject);
}

async function testGetTodo(id: string) {
  console.log(`\n🔍 Testing getTodo (id: ${id})...`);
  const result = await publicClient.graphql({
    query: getTodo,
    variables: { id },
  });
  console.log('✅ Todo:', (result as any).data.getTodo);
}

// ============================================================
// Mutation Test Functions
// ============================================================

async function testCreateProject(): Promise<string | null> {
  console.log('\n🆕 Testing createProject...');
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: createProject,
    variables: {
      input: {
        title: `Test Project ${Date.now()}`,
        status: ProjectStatus.ACTIVE,
        description: 'This is a test project created by the test script',
        color: '#007bff',
      },
    },
  });

  const project = (result as any).data.createProject;
  console.log('✅ Created project:', {
    id: project.id,
    title: project.title,
    status: project.status,
    owner: project.owner,
  });
  return project.id;
}

async function testUpdateProject(projectId: string): Promise<void> {
  console.log(`\n✏️ Testing updateProject (id: ${projectId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: updateProject,
    variables: {
      input: {
        id: projectId,
        title: 'Updated Test Project',
        description: 'This project was updated by the test script',
        status: ProjectStatus.ON_HOLD,
        color: '#28a745',
      },
    },
  });

  const project = (result as any).data.updateProject;
  console.log('✅ Updated project:', {
    id: project.id,
    title: project.title,
    status: project.status,
    color: project.color,
  });
}

async function testDeleteProject(projectId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteProject (id: ${projectId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: deleteProject,
    variables: { input: { id: projectId } },
  });
  const deleted = (result as any).data.deleteProject;
  console.log('✅ Deleted project:', deleted.title);
}

async function testCreateTodo(projectId?: string, images?: string[]): Promise<string | null> {
  console.log('\n🆕 Testing createTodo...');
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: createTodo,
    variables: {
      input: {
        name: `Test Todo ${Date.now()}`,
        description: 'This is a test todo created by the test script',
        projectID: projectId || null,
        images: images || [],
      },
    },
  });

  const todo = (result as any).data.createTodo;
  console.log('✅ Created todo:', {
    id: todo.id,
    name: todo.name,
    projectID: todo.projectID || 'unassigned',
    images: todo.images?.length || 0,
    owner: todo.owner,
  });
  return todo.id;
}

async function testUpdateTodo(todoId: string, newProjectId?: string): Promise<void> {
  console.log(`\n✏️ Testing updateTodo (id: ${todoId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: updateTodo,
    variables: {
      input: {
        id: todoId,
        name: 'Updated Test Todo',
        description: 'This todo was updated by the test script',
        projectID: newProjectId || null,
      },
    },
  });

  const todo = (result as any).data.updateTodo;
  console.log('✅ Updated todo:', {
    id: todo.id,
    name: todo.name,
    projectID: todo.projectID || 'unassigned',
  });
}

async function testDeleteTodo(todoId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteTodo (id: ${todoId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: deleteTodo,
    variables: { input: { id: todoId } },
  });
  const deleted = (result as any).data.deleteTodo;
  console.log('✅ Deleted todo:', deleted.name);
}

// ============================================================
// Storage Test Functions
// ============================================================

async function testUploadImage(): Promise<string | null> {
  console.log('\n📤 Testing uploadData (S3)...');

  // Try to use local image file, fallback to generated image
  const localImagePath = 'ADD_TEST_IMAGE_HERE';
  let imageBuffer: Buffer;
  let contentType: string;
  let fileExt: string;

  if (fs.existsSync(localImagePath)) {
    imageBuffer = fs.readFileSync(localImagePath);
    contentType = 'image/jpeg';
    fileExt = 'jpg';
    console.log('   Using local image file');
  } else {
    // Fallback: create a simple test image (100x100 gray square)
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAA3klEQVR42u3QMQEAAAgDILV/51nBzwci0JlYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqxYsWLFihUrVqz8WgGPGAGBPQqrHAAAAABJRU5ErkJggg==';
    imageBuffer = Buffer.from(testImageBase64, 'base64');
    contentType = 'image/png';
    fileExt = 'png';
    console.log('   Using generated test image');
  }

  const fileName = `test-image-${Date.now()}.${fileExt}`;
  const s3Path = `public/images/${fileName}`;

  console.log(`   Uploading to: ${s3Path}`);
  console.log(`   File size: ${imageBuffer.length} bytes`);

  const result = await uploadData({
    path: s3Path,
    data: imageBuffer,
    options: { contentType },
  }).result;

  console.log('✅ Upload successful!');
  console.log('   Path:', result.path);
  return result.path;
}

async function testGetUrl(filePath: string): Promise<string | null> {
  console.log('\n🔗 Testing getUrl (S3)...');
  console.log(`   File path: ${filePath}`);

  const result = await getUrl({
    path: filePath,
    options: { expiresIn: 3600 },
  });

  console.log('✅ Got signed URL!');
  console.log('   URL:', result.url.toString().substring(0, 100) + '...');
  console.log('   Expires at:', result.expiresAt);
  return result.url.toString();
}

async function testGetProperties(filePath: string): Promise<void> {
  console.log('\n📋 Testing getProperties (S3)...');
  console.log(`   File path: ${filePath}`);

  const properties = await getProperties({ path: filePath });

  console.log('✅ Got file properties!');
  if ('contentType' in properties) console.log('   Content Type:', (properties as any).contentType);
  if ('size' in properties) console.log('   Size:', (properties as any).size, 'bytes');
  if ('eTag' in properties) console.log('   ETag:', (properties as any).eTag);
  if ('lastModified' in properties) console.log('   Last Modified:', (properties as any).lastModified);
}

async function testDownloadData(filePath: string): Promise<void> {
  console.log('\n📥 Testing downloadData (S3)...');
  console.log(`   File path: ${filePath}`);

  const downloadResult = await downloadData({ path: filePath }).result;
  const blob = await downloadResult.body.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log('✅ Download successful!');
  console.log('   Downloaded size:', buffer.length, 'bytes');
  console.log('   Content type:', blob.type);

  const localPath = `./downloaded-test-image-${Date.now()}.png`;
  fs.writeFileSync(localPath, buffer);
  console.log('   Saved to:', localPath);
}

// ============================================================
// Main Test Runners
// ============================================================

async function runPublicQueryTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📖 PART 1: Public GraphQL Queries (No Auth)');
  console.log('='.repeat(50));

  await runTest('getRandomQuote', testGetRandomQuote);
  const projectId = await runTest('listProjects', testListProjects);
  const todoId = await runTest('listTodos', testListTodos);

  if (projectId) await runTest('getProject', () => testGetProject(projectId));
  if (todoId) await runTest('getTodo', () => testGetTodo(todoId));
}

async function runMutationTests() {
  console.log('\n' + '='.repeat(50));
  console.log('✏️ PART 2: Authenticated GraphQL Mutations');
  console.log('='.repeat(50));

  // Create project and todo
  const projectId = await runTest('createProject', testCreateProject);
  const todoId = await runTest('createTodo', () => testCreateTodo(projectId || undefined));

  // Update project and todo
  if (projectId) await runTest('updateProject', () => testUpdateProject(projectId));
  if (todoId) await runTest('updateTodo', () => testUpdateTodo(todoId, projectId || undefined));

  // Cleanup: delete todo and project
  if (todoId) await runTest('deleteTodo', () => testDeleteTodo(todoId));
  if (projectId) await runTest('deleteProject', () => testDeleteProject(projectId));
}

async function runStorageTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📦 PART 3: S3 Storage Operations');
  console.log('='.repeat(50));

  const uploadedPath = await runTest('uploadImage', testUploadImage);

  if (uploadedPath) {
    await runTest('getUrl', () => testGetUrl(uploadedPath));
    await runTest('getProperties', () => testGetProperties(uploadedPath));
    await runTest('downloadData', () => testDownloadData(uploadedPath));

    // Create a todo with the uploaded image
    console.log('\n📝 Creating todo with uploaded image...');
    await runTest('createTodoWithImage', () => testCreateTodo(undefined, [uploadedPath]));
    console.log('🎉 Check your browser - the todo should appear with the image!');
  }
}

async function runAllTests() {
  console.log('🚀 Starting Consolidated Test Script\n');
  console.log('This script tests:');
  console.log('  1. Public GraphQL Queries');
  console.log('  2. Authenticated GraphQL Mutations');
  console.log('  3. S3 Storage Operations');

  // Check credentials
  if (TEST_USER.username === 'YOUR_USERNAME_HERE') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    return;
  }

  // Part 1: Public queries (no auth needed)
  await runPublicQueryTests();

  // Authenticate for parts 2 and 3
  const isAuthenticated = await authenticateUser();
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run authenticated tests without authentication');
    return;
  }

  // Part 2: Mutations
  await runMutationTests();

  // Part 3: Storage
  await runStorageTests();

  // Sign out
  await signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

// Run all tests
void runAllTests();
