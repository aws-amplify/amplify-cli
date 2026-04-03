/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { signIn, signOut } from 'aws-amplify/auth';
import { uploadData, getUrl, downloadData, getProperties } from 'aws-amplify/storage';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { getProject, getTodo, listProjects, listTodos } from './src/graphql/queries';
import {
  createProject, updateProject, deleteProject,
  createTodo, updateTodo, deleteTodo,
} from './src/graphql/mutations';
import { ProjectStatus } from './src/API';

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

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


async function main(): Promise<void> {
  const [configPath] = process.argv.slice(2);
  const config = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));

  Amplify.configure(config);

  const { username, password } = await signUp(config);

  await signIn({ username, password });

  console.log('')
  console.log('='.repeat(60));
  console.log('🎯 Lambda Query (getRandomQuote)');
  console.log('='.repeat(60));
  console.log('')

  await testGetRandomQuote();

  console.log('')
  console.log('='.repeat(60));
  console.log('📖 Public GraphQL Queries (Projects, Todos)');
  console.log('='.repeat(60));
  console.log('')

  await testListProjects();
  await testListTodos();

  console.log('')
  console.log('='.repeat(60));
  console.log('✏️ Project CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const projectId = await testCreateProject();
  await testGetProject(projectId);
  await testUpdateProject(projectId);

  console.log('')
  console.log('='.repeat(60));
  console.log('📝 Todo CRUD Operations');
  console.log('='.repeat(60));
  console.log('')

  const todoId = await testCreateTodo(projectId);
  await testGetTodo(todoId);
  await testUpdateTodo(todoId, projectId);

  console.log('')
  console.log('='.repeat(60));
  console.log('📦 S3 Storage Operations');
  console.log('='.repeat(60));
  console.log('')

  const uploadedPath = await testUploadImage();
  await testGetUrl(uploadedPath);
  await testGetProperties(uploadedPath);
  await testDownloadData(uploadedPath);

  console.log('')
  console.log('='.repeat(60));
  console.log('🧹 Cleanup');
  console.log('='.repeat(60));
  console.log('')

  await testDeleteTodo(todoId);
  await testDeleteProject(projectId);

  await signOut();
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});



// ============================================================
// Public Query Tests
// ============================================================

async function testGetRandomQuote(): Promise<void> {
  console.log('🎯 Testing getRandomQuote (Lambda)...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: getRandomQuote });
  const quote = (result as any).data.getRandomQuote;
  console.log(`✅ "${quote.quote}" — ${quote.author}`);
}

async function testListProjects(): Promise<void> {
  console.log('📋 Testing listProjects...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: listProjects });
  const projects = (result as any).data.listProjects.items;
  console.log(`✅ Found ${projects.length} projects`);
}

async function testListTodos(): Promise<void> {
  console.log('📋 Testing listTodos...');
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: listTodos });
  const todos = (result as any).data.listTodos.items;
  console.log(`✅ Found ${todos.length} todos`);
}

async function testGetProject(id: string): Promise<void> {
  console.log(`🔍 Testing getProject (id: ${id.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: getProject, variables: { id } });
  const project = (result as any).data.getProject;
  console.log(`✅ Project: ${project.title} (${project.status})`);
}

async function testGetTodo(id: string): Promise<void> {
  console.log(`🔍 Testing getTodo (id: ${id.substring(0, 8)}...)...`);
  const publicClient = generateClient({ authMode: 'apiKey' });
  const result = await publicClient.graphql({ query: getTodo, variables: { id } });
  const todo = (result as any).data.getTodo;
  console.log(`✅ Todo: ${todo.name}`);
}



// ============================================================
// Mutation Tests
// ============================================================

async function testCreateProject(): Promise<string> {
  console.log('🆕 Testing createProject...');
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: createProject,
    variables: {
      input: {
        title: `Test Project ${Date.now()}`,
        status: ProjectStatus.ACTIVE,
        description: 'Test project created by frontest',
        color: '#007bff',
      },
    },
  });
  const project = (result as any).data.createProject;
  console.log('✅ Created project:', project.id.substring(0, 8) + '...');
  return project.id;
}

async function testUpdateProject(projectId: string): Promise<void> {
  console.log(`✏️ Testing updateProject (id: ${projectId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });

  await authClient.graphql({
    query: updateProject,
    variables: {
      input: {
        id: projectId,
        title: 'Updated Test Project',
        description: 'Updated by frontest',
        status: ProjectStatus.ON_HOLD,
        color: '#28a745',
      },
    },
  });
  console.log('✅ Updated project');
}

async function testDeleteProject(projectId: string): Promise<void> {
  console.log(`🗑️ Testing deleteProject (id: ${projectId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });

  await authClient.graphql({
    query: deleteProject,
    variables: { input: { id: projectId } },
  });
  console.log('✅ Deleted project');
}

async function testCreateTodo(projectId?: string): Promise<string> {
  console.log('🆕 Testing createTodo...');
  const authClient = generateClient({ authMode: 'userPool' });

  const result = await authClient.graphql({
    query: createTodo,
    variables: {
      input: {
        name: `Test Todo ${Date.now()}`,
        description: 'Test todo created by frontest',
        projectID: projectId || null,
        images: [],
      },
    },
  });
  const todo = (result as any).data.createTodo;
  console.log('✅ Created todo:', todo.id.substring(0, 8) + '...');
  return todo.id;
}

async function testUpdateTodo(todoId: string, projectId?: string): Promise<void> {
  console.log(`✏️ Testing updateTodo (id: ${todoId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });

  await authClient.graphql({
    query: updateTodo,
    variables: {
      input: {
        id: todoId,
        name: 'Updated Test Todo',
        description: 'Updated by frontest',
        projectID: projectId || null,
      },
    },
  });
  console.log('✅ Updated todo');
}

async function testDeleteTodo(todoId: string): Promise<void> {
  console.log(`🗑️ Testing deleteTodo (id: ${todoId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'userPool' });

  await authClient.graphql({
    query: deleteTodo,
    variables: { input: { id: todoId } },
  });
  console.log('✅ Deleted todo');
}



// ============================================================
// S3 Storage Tests
// ============================================================

async function testUploadImage(): Promise<string> {
  console.log('📤 Testing uploadData (S3)...');
  // 1x1 transparent PNG
  const testImageBase64 =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  const imageBuffer = Buffer.from(testImageBase64, 'base64');
  const fileName = `test-image-${Date.now()}.png`;
  const s3Path = `public/images/${fileName}`;

  const result = await uploadData({
    path: s3Path,
    data: imageBuffer,
    options: { contentType: 'image/png' },
  }).result;

  console.log('✅ Upload successful! Path:', result.path);
  return result.path;
}

async function testGetUrl(filePath: string): Promise<void> {
  console.log('🔗 Testing getUrl (S3 signed URL)...');

  const result = await getUrl({
    path: filePath,
    options: { expiresIn: 3600 },
  });
  console.log('✅ Got signed URL:', result.url.toString().substring(0, 80) + '...');
}

async function testGetProperties(filePath: string): Promise<void> {
  console.log('📋 Testing getProperties (S3)...');

  const properties = await getProperties({ path: filePath });
  if ('contentType' in properties) console.log('   Content Type:', (properties as any).contentType);
  if ('size' in properties) console.log('   Size:', (properties as any).size, 'bytes');
  console.log('✅ Got file properties');
}

async function testDownloadData(filePath: string): Promise<void> {
  console.log('📥 Testing downloadData (S3)...');

  const downloadResult = await downloadData({ path: filePath }).result;
  const blob = await downloadResult.body.blob();
  const arrayBuffer = await blob.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  console.log(`✅ Downloaded ${buffer.length} bytes`);
}



// ============================================================
// User Provisioning
// ============================================================

async function signUp(config: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  // Imported-resources app uses email-based auth
  const username = generateTestEmail();
  const password = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: password,
    UserAttributes: [
      { Name: 'email', Value: username },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: username,
    Password: password,
    Permanent: true,
  }));

  return { username, password };
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
