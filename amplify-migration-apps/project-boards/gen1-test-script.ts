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
import amplifyconfig from './amplifyconfiguration.json';

// Configure Amplify
Amplify.configure(amplifyconfig);

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_USERNAME_HERE',
  password: 'YOUR_PASSWORD_HERE',
};

// Clients
const publicClient = generateClient();

// ============================================================
// GraphQL Queries (Public - no auth required)
// ============================================================

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

const listProjects = /* GraphQL */ `
  query ListProjects {
    listProjects {
      items {
        id
        title
        description
        status
        deadline
        color
        createdAt
        updatedAt
        owner
      }
      nextToken
    }
  }
`;

const listTodos = /* GraphQL */ `
  query ListTodos {
    listTodos {
      items {
        id
        name
        description
        images
        projectID
        createdAt
        updatedAt
        owner
      }
      nextToken
    }
  }
`;

const getProject = /* GraphQL */ `
  query GetProject($id: ID!) {
    getProject(id: $id) {
      id
      title
      description
      status
      deadline
      color
      createdAt
      updatedAt
      owner
    }
  }
`;

const getTodo = /* GraphQL */ `
  query GetTodo($id: ID!) {
    getTodo(id: $id) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      owner
    }
  }
`;

// ============================================================
// GraphQL Mutations (Require authentication)
// ============================================================

const createProject = /* GraphQL */ `
  mutation CreateProject($input: CreateProjectInput!) {
    createProject(input: $input) {
      id
      title
      description
      status
      deadline
      color
      createdAt
      updatedAt
      owner
    }
  }
`;

const updateProject = /* GraphQL */ `
  mutation UpdateProject($input: UpdateProjectInput!) {
    updateProject(input: $input) {
      id
      title
      description
      status
      deadline
      color
      createdAt
      updatedAt
      owner
    }
  }
`;

const deleteProject = /* GraphQL */ `
  mutation DeleteProject($input: DeleteProjectInput!) {
    deleteProject(input: $input) {
      id
      title
    }
  }
`;

const createTodo = /* GraphQL */ `
  mutation CreateTodo($input: CreateTodoInput!) {
    createTodo(input: $input) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      owner
    }
  }
`;

const updateTodo = /* GraphQL */ `
  mutation UpdateTodo($input: UpdateTodoInput!) {
    updateTodo(input: $input) {
      id
      name
      description
      images
      projectID
      createdAt
      updatedAt
      owner
    }
  }
`;

const deleteTodo = /* GraphQL */ `
  mutation DeleteTodo($input: DeleteTodoInput!) {
    deleteTodo(input: $input) {
      id
      name
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
  try {
    const result = await publicClient.graphql({ query: getRandomQuote });
    console.log('✅ Success:', (result as any).data.getRandomQuote);
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

async function testListProjects(): Promise<string | null> {
  console.log('\n📋 Testing listProjects...');
  try {
    const result = await publicClient.graphql({ query: listProjects });
    const projects = (result as any).data.listProjects.items;
    console.log(`✅ Found ${projects.length} projects:`);
    projects.forEach((p: any) => console.log(`   - [${p.id}] ${p.title} (${p.status})`));
    return projects.length > 0 ? projects[0].id : null;
  } catch (error) {
    console.log('❌ Error:', error);
    return null;
  }
}

async function testListTodos(): Promise<string | null> {
  console.log('\n✅ Testing listTodos...');
  try {
    const result = await publicClient.graphql({ query: listTodos });
    const todos = (result as any).data.listTodos.items;
    console.log(`✅ Found ${todos.length} todos:`);
    todos.forEach((t: any) => console.log(`   - [${t.id}] ${t.name}: ${t.description || '(no description)'}`));
    return todos.length > 0 ? todos[0].id : null;
  } catch (error) {
    console.log('❌ Error:', error);
    return null;
  }
}

async function testGetProject(id: string) {
  console.log(`\n🔍 Testing getProject (id: ${id})...`);
  try {
    const result = await publicClient.graphql({
      query: getProject,
      variables: { id },
    });
    console.log('✅ Project:', (result as any).data.getProject);
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

async function testGetTodo(id: string) {
  console.log(`\n🔍 Testing getTodo (id: ${id})...`);
  try {
    const result = await publicClient.graphql({
      query: getTodo,
      variables: { id },
    });
    console.log('✅ Todo:', (result as any).data.getTodo);
  } catch (error) {
    console.log('❌ Error:', error);
  }
}

// ============================================================
// Mutation Test Functions
// ============================================================

async function testCreateProject(): Promise<string | null> {
  console.log('\n🆕 Testing createProject...');
  const authClient = generateClient({ authMode: 'userPool' });

  try {
    const result = await authClient.graphql({
      query: createProject,
      variables: {
        input: {
          title: `Test Project ${Date.now()}`,
          status: 'ACTIVE',
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
  } catch (error: any) {
    console.log('❌ Error:', error.errors?.[0]?.message || error);
    return null;
  }
}

async function testUpdateProject(projectId: string): Promise<void> {
  console.log(`\n✏️ Testing updateProject (id: ${projectId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  try {
    const result = await authClient.graphql({
      query: updateProject,
      variables: {
        input: {
          id: projectId,
          title: 'Updated Test Project',
          description: 'This project was updated by the test script',
          status: 'ON_HOLD',
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
  } catch (error: any) {
    console.log('❌ Error:', error.errors?.[0]?.message || error);
  }
}

async function testDeleteProject(projectId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteProject (id: ${projectId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  try {
    const result = await authClient.graphql({
      query: deleteProject,
      variables: { input: { id: projectId } },
    });
    const deleted = (result as any).data.deleteProject;
    console.log('✅ Deleted project:', deleted.title);
  } catch (error: any) {
    console.log('❌ Error:', error.errors?.[0]?.message || error);
  }
}

async function testCreateTodo(projectId?: string, images?: string[]): Promise<string | null> {
  console.log('\n🆕 Testing createTodo...');
  const authClient = generateClient({ authMode: 'userPool' });

  try {
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
  } catch (error: any) {
    console.log('❌ Error:', error.errors?.[0]?.message || error);
    return null;
  }
}

async function testUpdateTodo(todoId: string, newProjectId?: string): Promise<void> {
  console.log(`\n✏️ Testing updateTodo (id: ${todoId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  try {
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
  } catch (error: any) {
    console.log('❌ Error:', error.errors?.[0]?.message || error);
  }
}

async function testDeleteTodo(todoId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteTodo (id: ${todoId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  try {
    const result = await authClient.graphql({
      query: deleteTodo,
      variables: { input: { id: todoId } },
    });
    const deleted = (result as any).data.deleteTodo;
    console.log('✅ Deleted todo:', deleted.name);
  } catch (error: any) {
    console.log('❌ Error:', error.errors?.[0]?.message || error);
  }
}

// ============================================================
// Storage Test Functions
// ============================================================

async function testUploadImage(): Promise<string | null> {
  console.log('\n📤 Testing uploadData (S3)...');

  try {
    // Try to use local image file, fallback to generated image
    const localImagePath = './61KOR4NQXTL._AC_UF894,1000_QL80_.jpg';
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
  } catch (error: any) {
    console.log('❌ Upload error:', error.message || error);
    return null;
  }
}

async function testGetUrl(filePath: string): Promise<string | null> {
  console.log('\n🔗 Testing getUrl (S3)...');
  console.log(`   File path: ${filePath}`);

  try {
    const result = await getUrl({
      path: filePath,
      options: { expiresIn: 3600 },
    });

    console.log('✅ Got signed URL!');
    console.log('   URL:', result.url.toString().substring(0, 100) + '...');
    console.log('   Expires at:', result.expiresAt);
    return result.url.toString();
  } catch (error: any) {
    console.log('❌ GetUrl error:', error.message || error);
    return null;
  }
}

async function testGetProperties(filePath: string): Promise<void> {
  console.log('\n📋 Testing getProperties (S3)...');
  console.log(`   File path: ${filePath}`);

  try {
    const properties = await getProperties({ path: filePath });

    console.log('✅ Got file properties!');
    if ('contentType' in properties) console.log('   Content Type:', (properties as any).contentType);
    if ('size' in properties) console.log('   Size:', (properties as any).size, 'bytes');
    if ('eTag' in properties) console.log('   ETag:', (properties as any).eTag);
    if ('lastModified' in properties) console.log('   Last Modified:', (properties as any).lastModified);
  } catch (error: any) {
    console.log('❌ GetProperties error:', error.message || error);
  }
}

async function testDownloadData(filePath: string): Promise<void> {
  console.log('\n📥 Testing downloadData (S3)...');
  console.log(`   File path: ${filePath}`);

  try {
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
  } catch (error: any) {
    console.log('❌ Download error:', error.message || error);
  }
}

// ============================================================
// Main Test Runners
// ============================================================

async function runPublicQueryTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📖 PART 1: Public GraphQL Queries (No Auth)');
  console.log('='.repeat(50));

  await testGetRandomQuote();
  const projectId = await testListProjects();
  const todoId = await testListTodos();

  if (projectId) await testGetProject(projectId);
  if (todoId) await testGetTodo(todoId);
}

async function runMutationTests() {
  console.log('\n' + '='.repeat(50));
  console.log('✏️ PART 2: Authenticated GraphQL Mutations');
  console.log('='.repeat(50));

  // Create project and todo
  const projectId = await testCreateProject();
  const todoId = await testCreateTodo(projectId || undefined);

  // Update project and todo
  if (projectId) await testUpdateProject(projectId);
  if (todoId) await testUpdateTodo(todoId, projectId || undefined);

  // Cleanup: delete todo and project
  if (todoId) await testDeleteTodo(todoId);
  if (projectId) await testDeleteProject(projectId);
}

async function runStorageTests() {
  console.log('\n' + '='.repeat(50));
  console.log('📦 PART 3: S3 Storage Operations');
  console.log('='.repeat(50));

  const uploadedPath = await testUploadImage();

  if (uploadedPath) {
    await testGetUrl(uploadedPath);
    await testGetProperties(uploadedPath);
    await testDownloadData(uploadedPath);

    // Create a todo with the uploaded image
    console.log('\n📝 Creating todo with uploaded image...');
    await testCreateTodo(undefined, [uploadedPath]);
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

  console.log('\n' + '='.repeat(50));
  console.log('✨ All tests completed!');
  console.log('='.repeat(50));
}

// Run all tests
void runAllTests();
