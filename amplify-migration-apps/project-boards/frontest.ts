/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import * as fs from 'fs';
import { uploadData, getUrl, downloadData, getProperties } from 'aws-amplify/storage';
import { generateClient } from 'aws-amplify/api';
import { getProject, getTodo, listProjects, listTodos } from './src/graphql/queries';
import { createProject, updateProject, deleteProject, createTodo, updateTodo, deleteTodo } from './src/graphql/mutations';
import { signIn, signOut } from 'aws-amplify/auth';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as os from 'os';
import { randomBytes } from 'crypto';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
import { ProjectStatus } from './src/API';
import path from 'path';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}


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

async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  Amplify.configure(config);

  const { username, password } = await signUp(config);

  await signIn({ username, password });

  console.log('')
  console.log('='.repeat(50));
  console.log('📖 Public GraphQL Queries (No Auth)');
  console.log('='.repeat(50));
  console.log('')

  await testGetRandomQuote();
  await testListProjects();
  await testListTodos();

  console.log('')
  console.log('='.repeat(50));
  console.log('✏️ Authenticated GraphQL Mutations');
  console.log('='.repeat(50));
  console.log('')

  const projectId = await testCreateProject();
  const todoId = await testCreateTodo(projectId);

  await testGetProject(projectId);
  await testGetTodo(todoId);

  await testUpdateProject(projectId);
  await testUpdateTodo(todoId, projectId);

  await testDeleteTodo(todoId);
  await testDeleteProject(projectId);

  console.log('')
  console.log('='.repeat(50));
  console.log('📦 S3 Storage Operations');
  console.log('='.repeat(50));
  console.log('')

  const uploadedPath = await testUploadImage()

  await testGetUrl(uploadedPath);
  await testGetProperties(uploadedPath);
  await testDownloadData(uploadedPath);
  await testCreateTodo(undefined, [uploadedPath]);

  await signOut();

}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});


async function testGetRandomQuote(): Promise<void> {

  const publicClient = generateClient({ authMode: 'apiKey' });

  console.log('📝 Testing getRandomQuote...');
  const result = await publicClient.graphql({ query: getRandomQuote });
  console.log('✅ Success:', (result as any).data.getRandomQuote);
}

async function testListProjects(): Promise<string | null> {

  const publicClient = generateClient({ authMode: 'apiKey' });

  console.log('📋 Testing listProjects...');
  const result = await publicClient.graphql({ query: listProjects });
  const projects = (result as any).data.listProjects.items;
  console.log(`✅ Found ${projects.length} projects:`);
  projects.forEach((p: any) => console.log(`   - [${p.id}] ${p.title} (${p.status})`));
  return projects.length > 0 ? projects[0].id : null;
}

async function testListTodos(): Promise<string | null> {

  const publicClient = generateClient({ authMode: 'apiKey' });

  console.log('✅ Testing listTodos...');
  const result = await publicClient.graphql({ query: listTodos });
  const todos = (result as any).data.listTodos.items;
  console.log(`✅ Found ${todos.length} todos:`);
  todos.forEach((t: any) => console.log(`   - [${t.id}] ${t.name}: ${t.description || '(no description)'}`));
  return todos.length > 0 ? todos[0].id : null;
}

async function testGetProject(id: string): Promise<void> {

  const publicClient = generateClient({ authMode: 'apiKey' });

  console.log(`🔍 Testing getProject (id: ${id})...`);
  const result = await publicClient.graphql({
    query: getProject,
    variables: { id },
  });
  console.log('✅ Project:', (result as any).data.getProject);
}

async function testGetTodo(id: string): Promise<void> {

  const publicClient = generateClient({ authMode: 'apiKey' });

  console.log(`🔍 Testing getTodo (id: ${id})...`);
  const result = await publicClient.graphql({
    query: getTodo,
    variables: { id },
  });
  console.log('✅ Todo:', (result as any).data.getTodo);
}

async function testCreateProject(): Promise<string> {
  console.log('🆕 Testing createProject...');
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
  console.log(`✏️ Testing updateProject (id: ${projectId})...`);
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
  console.log(`🗑️ Testing deleteProject (id: ${projectId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: deleteProject,
    variables: { input: { id: projectId } },
  });
  const deleted = (result as any).data.deleteProject;
  console.log('✅ Deleted project:', deleted.title);
}

async function testCreateTodo(projectId?: string, images?: string[]): Promise<string> {
  console.log('🆕 Testing createTodo...');
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
  console.log(`✏️ Testing updateTodo (id: ${todoId})...`);
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
  console.log(`🗑️ Testing deleteTodo (id: ${todoId})...`);
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: deleteTodo,
    variables: { input: { id: todoId } },
  });
  const deleted = (result as any).data.deleteTodo;
  console.log('✅ Deleted todo:', deleted.name);
}

async function testUploadImage(): Promise<string> {
  console.log('📤 Testing uploadData (S3)...');

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
  console.log('🔗 Testing getUrl (S3)...');
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
  console.log('📋 Testing getProperties (S3)...');
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

  const localPath = path.join(os.tmpdir(), `./downloaded-test-image-${Date.now()}.png`);
  fs.writeFileSync(localPath, buffer);
  console.log('   Saved to:', localPath);
}

async function signUp(config: any): Promise<{ username: string; password: string }> {

  // Support both Gen1 (aws_user_pools_id) and Gen2 (auth.user_pool_id) config formats
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  const username = generateTestEmail();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
    MessageAction: 'SUPPRESS',
    UserAttributes: [
      { Name: 'email', Value: username },
      { Name: 'email_verified', Value: 'true' },
    ],
  }));

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: username,
      Password: password,
      Permanent: true,
    }),
  );
  return { username, password };
}

function generateTestPassword(): string {
  // Meets Cognito default policy: uppercase, lowercase, digit, special, 8+ chars
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
