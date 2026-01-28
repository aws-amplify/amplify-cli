/**
 * Consolidated Test Script for Discussions App
 *
 * This script tests all functionality:
 * 1. Public GraphQL Queries (Topics, Posts, Comments)
 * 2. Authenticated GraphQL Mutations (CRUD operations)
 * 3. User Activity Tracking
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
import amplifyconfig from './src/amplifyconfiguration.json';
import { createTestRunner } from './test-utils';
import { getTopic, listTopics, getPost, listPosts, getComment, listComments, fetchUserActivity } from './src/graphql/queries';
import {
  createTopic,
  updateTopic,
  deleteTopic,
  createPost,
  updatePost,
  deletePost,
  createComment,
  updateComment,
  deleteComment,
} from './src/graphql/mutations';

// Configure Amplify
Amplify.configure(amplifyconfig);

// Initialize test runner
const { runTest, printSummary } = createTestRunner();

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_USERNAME_HERE', // Phone number format
  password: 'YOUR_PASSWORD_HERE',
};

// Clients
const publicClient = generateClient();

// ============================================================
// Authentication Helper Functions
// ============================================================
let currentUserId: string | null = null;

async function authenticateUser(): Promise<boolean> {
  console.log('\n🔐 Authenticating user...');
  try {
    await signIn({
      username: TEST_USER.username,
      password: TEST_USER.password,
    });
    const user = await getCurrentUser();
    currentUserId = user.userId;
    console.log(`✅ Signed in as: ${user.username}`);
    console.log(`   User ID: ${currentUserId}`);
    return true;
  } catch (error: any) {
    if (error.name === 'UserAlreadyAuthenticatedException') {
      const user = await getCurrentUser();
      currentUserId = user.userId;
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
// Query Test Functions
// ============================================================
async function testListTopics(): Promise<string | null> {
  console.log('\n📋 Testing listTopics...');
  const result = await publicClient.graphql({ query: listTopics });
  const topics = (result as any).data.listTopics.items;
  console.log(`✅ Found ${topics.length} topics:`);
  topics.slice(0, 5).forEach((t: any) => {
    const topicName = t.content.includes(':') ? t.content.split(':')[1] : t.content;
    const category = t.content.includes(':') ? t.content.split(':')[0] : 'unknown';
    console.log(`   - [${t.id.substring(0, 8)}...] ${topicName} (${category})`);
  });
  if (topics.length > 5) console.log(`   ... and ${topics.length - 5} more`);
  return topics.length > 0 ? topics[0].id : null;
}

async function testGetTopic(id: string): Promise<void> {
  console.log(`\n🔍 Testing getTopic (id: ${id.substring(0, 8)}...)...`);
  const result = await publicClient.graphql({
    query: getTopic,
    variables: { id },
  });
  const topic = (result as any).data.getTopic;
  console.log('✅ Topic:', {
    id: topic.id.substring(0, 8) + '...',
    content: topic.content,
    createdBy: topic.createdByUserId,
  });
}

async function testListPosts(topicId?: string): Promise<string | null> {
  console.log('\n📋 Testing listPosts...');
  const variables: any = {};
  if (topicId) {
    variables.filter = { topicPostsId: { eq: topicId } };
    console.log(`   Filtering by topic: ${topicId.substring(0, 8)}...`);
  }

  const result = await publicClient.graphql({ query: listPosts, variables });
  const posts = (result as any).data.listPosts.items;
  console.log(`✅ Found ${posts.length} posts:`);
  posts.slice(0, 5).forEach((p: any) => {
    const preview = p.content?.substring(0, 50) || '(no content)';
    console.log(`   - [${p.id.substring(0, 8)}...] ${preview}${p.content?.length > 50 ? '...' : ''}`);
  });
  if (posts.length > 5) console.log(`   ... and ${posts.length - 5} more`);
  return posts.length > 0 ? posts[0].id : null;
}

async function testGetPost(id: string): Promise<void> {
  console.log(`\n🔍 Testing getPost (id: ${id.substring(0, 8)}...)...`);
  const result = await publicClient.graphql({
    query: getPost,
    variables: { id },
  });
  const post = (result as any).data.getPost;
  console.log('✅ Post:', {
    id: post.id.substring(0, 8) + '...',
    content: post.content?.substring(0, 100) + (post.content?.length > 100 ? '...' : ''),
    topicId: post.topicPostsId?.substring(0, 8) + '...',
    createdBy: post.createdByUserId,
  });
}

async function testListComments(postId?: string): Promise<string | null> {
  console.log('\n📋 Testing listComments...');
  const variables: any = {};
  if (postId) {
    variables.filter = { postCommentsId: { eq: postId } };
    console.log(`   Filtering by post: ${postId.substring(0, 8)}...`);
  }

  const result = await publicClient.graphql({ query: listComments, variables });
  const comments = (result as any).data.listComments.items;
  console.log(`✅ Found ${comments.length} comments:`);
  comments.slice(0, 5).forEach((c: any) => {
    const preview = c.content?.substring(0, 50) || '(no content)';
    console.log(`   - [${c.id.substring(0, 8)}...] ${preview}${c.content?.length > 50 ? '...' : ''}`);
  });
  if (comments.length > 5) console.log(`   ... and ${comments.length - 5} more`);
  return comments.length > 0 ? comments[0].id : null;
}

async function testGetComment(id: string): Promise<void> {
  console.log(`\n🔍 Testing getComment (id: ${id.substring(0, 8)}...)...`);
  const result = await publicClient.graphql({
    query: getComment,
    variables: { id },
  });
  const comment = (result as any).data.getComment;
  console.log('✅ Comment:', {
    id: comment.id.substring(0, 8) + '...',
    content: comment.content?.substring(0, 100) + (comment.content?.length > 100 ? '...' : ''),
    postId: comment.postCommentsId?.substring(0, 8) + '...',
    createdBy: comment.createdByUserId,
  });
}

async function testFetchUserActivity(userId: string): Promise<void> {
  console.log(`\n📊 Testing fetchUserActivity (userId: ${userId.substring(0, 8)}...)...`);
  const result = await publicClient.graphql({
    query: fetchUserActivity,
    variables: { userId },
  });
  const activities = (result as any).data.fetchUserActivity || [];
  console.log(`✅ Found ${activities.length} activities:`);
  activities.slice(0, 10).forEach((a: any) => {
    const time = new Date(a.timestamp).toLocaleString();
    console.log(`   - ${a.activityType.replace('_', ' ').toUpperCase()} at ${time}`);
  });
  if (activities.length > 10) console.log(`   ... and ${activities.length - 10} more`);
}

// ============================================================
// Topic Mutation Test Functions
// ============================================================
async function testCreateTopic(discussionId: string = 'tech'): Promise<string | null> {
  console.log('\n🆕 Testing createTopic...');
  const authClient = generateClient({ authMode: 'apiKey' });

  const topicName = `Test Topic ${Date.now()}`;
  const content = `${discussionId}:${topicName}`;

  const result = await authClient.graphql({
    query: createTopic,
    variables: {
      input: {
        content,
        createdByUserId: currentUserId,
      },
    },
  });
  const topic = (result as any).data.createTopic;
  console.log('✅ Created topic:', {
    id: topic.id.substring(0, 8) + '...',
    content: topic.content,
    createdBy: topic.createdByUserId,
  });
  return topic.id;
}

async function testUpdateTopic(topicId: string): Promise<void> {
  console.log(`\n✏️ Testing updateTopic (id: ${topicId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: updateTopic,
    variables: {
      input: {
        id: topicId,
        content: `tech:Updated Topic ${Date.now()}`,
      },
    },
  });
  const topic = (result as any).data.updateTopic;
  console.log('✅ Updated topic:', {
    id: topic.id.substring(0, 8) + '...',
    content: topic.content,
  });
}

async function testDeleteTopic(topicId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteTopic (id: ${topicId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: deleteTopic,
    variables: { input: { id: topicId } },
  });
  const deleted = (result as any).data.deleteTopic;
  console.log('✅ Deleted topic:', deleted.content);
}

// ============================================================
// Post Mutation Test Functions
// ============================================================
async function testCreatePost(topicId: string): Promise<string | null> {
  console.log('\n🆕 Testing createPost...');
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: createPost,
    variables: {
      input: {
        content: `This is a test post created at ${new Date().toISOString()}. Testing the discussions app functionality!`,
        topicPostsId: topicId,
        createdByUserId: currentUserId,
      },
    },
  });
  const post = (result as any).data.createPost;
  console.log('✅ Created post:', {
    id: post.id.substring(0, 8) + '...',
    content: post.content.substring(0, 50) + '...',
    topicId: post.topicPostsId?.substring(0, 8) + '...',
    createdBy: post.createdByUserId,
  });
  return post.id;
}

async function testUpdatePost(postId: string): Promise<void> {
  console.log(`\n✏️ Testing updatePost (id: ${postId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: updatePost,
    variables: {
      input: {
        id: postId,
        content: `This post was updated at ${new Date().toISOString()}. Update test successful!`,
      },
    },
  });
  const post = (result as any).data.updatePost;
  console.log('✅ Updated post:', {
    id: post.id.substring(0, 8) + '...',
    content: post.content.substring(0, 50) + '...',
  });
}

async function testDeletePost(postId: string): Promise<void> {
  console.log(`\n🗑️ Testing deletePost (id: ${postId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: deletePost,
    variables: { input: { id: postId } },
  });
  const deleted = (result as any).data.deletePost;
  console.log('✅ Deleted post:', deleted.content?.substring(0, 30) + '...');
}

// ============================================================
// Comment Mutation Test Functions
// ============================================================
async function testCreateComment(postId: string): Promise<string | null> {
  console.log('\n🆕 Testing createComment...');
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: createComment,
    variables: {
      input: {
        content: `This is a test comment created at ${new Date().toISOString()}`,
        postCommentsId: postId,
        createdByUserId: currentUserId,
      },
    },
  });
  const comment = (result as any).data.createComment;
  console.log('✅ Created comment:', {
    id: comment.id.substring(0, 8) + '...',
    content: comment.content.substring(0, 50) + '...',
    postId: comment.postCommentsId?.substring(0, 8) + '...',
    createdBy: comment.createdByUserId,
  });
  return comment.id;
}

async function testUpdateComment(commentId: string): Promise<void> {
  console.log(`\n✏️ Testing updateComment (id: ${commentId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: updateComment,
    variables: {
      input: {
        id: commentId,
        content: `This comment was updated at ${new Date().toISOString()}`,
      },
    },
  });
  const comment = (result as any).data.updateComment;
  console.log('✅ Updated comment:', {
    id: comment.id.substring(0, 8) + '...',
    content: comment.content.substring(0, 50) + '...',
  });
}

async function testDeleteComment(commentId: string): Promise<void> {
  console.log(`\n🗑️ Testing deleteComment (id: ${commentId.substring(0, 8)}...)...`);
  const authClient = generateClient({ authMode: 'apiKey' });

  const result = await authClient.graphql({
    query: deleteComment,
    variables: { input: { id: commentId } },
  });
  const deleted = (result as any).data.deleteComment;
  console.log('✅ Deleted comment:', deleted.content?.substring(0, 30) + '...');
}

// ============================================================
// Main Test Runners
// ============================================================
async function runQueryTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📖 PART 1: GraphQL Queries');
  console.log('='.repeat(60));

  // Test Topics
  const topicId = await runTest('listTopics', testListTopics);
  if (topicId) await runTest('getTopic', () => testGetTopic(topicId));

  // Test Posts
  const postId = await runTest('listPosts', testListPosts);
  if (postId) await runTest('getPost', () => testGetPost(postId));

  // Test Posts filtered by topic
  if (topicId) {
    console.log('\n--- Testing posts filtered by topic ---');
    await runTest('listPostsByTopic', () => testListPosts(topicId));
  }

  // Test Comments
  const commentId = await runTest('listComments', testListComments);
  if (commentId) await runTest('getComment', () => testGetComment(commentId));

  // Test Comments filtered by post
  if (postId) {
    console.log('\n--- Testing comments filtered by post ---');
    await runTest('listCommentsByPost', () => testListComments(postId));
  }
}

async function runTopicMutationTests(): Promise<string | null> {
  console.log('\n' + '='.repeat(60));
  console.log('📝 PART 2: Topic CRUD Operations');
  console.log('='.repeat(60));

  // Create topic
  const topicId = await runTest('createTopic', () => testCreateTopic('tech'));
  if (!topicId) {
    console.log('❌ Failed to create topic, skipping remaining topic tests');
    return null;
  }

  // Read topic
  await runTest('getTopic (verify create)', () => testGetTopic(topicId));

  // Update topic
  await runTest('updateTopic', () => testUpdateTopic(topicId));

  // Verify update
  await runTest('getTopic (verify update)', () => testGetTopic(topicId));

  return topicId;
}

async function runPostMutationTests(topicId: string): Promise<string | null> {
  console.log('\n' + '='.repeat(60));
  console.log('💬 PART 3: Post CRUD Operations');
  console.log('='.repeat(60));

  // Create post
  const postId = await runTest('createPost', () => testCreatePost(topicId));
  if (!postId) {
    console.log('❌ Failed to create post, skipping remaining post tests');
    return null;
  }

  // Read post
  await runTest('getPost (verify create)', () => testGetPost(postId));

  // Update post
  await runTest('updatePost', () => testUpdatePost(postId));

  // Verify update
  await runTest('getPost (verify update)', () => testGetPost(postId));

  // List posts for this topic
  await runTest('listPosts (for topic)', () => testListPosts(topicId));

  return postId;
}

async function runCommentMutationTests(postId: string): Promise<string | null> {
  console.log('\n' + '='.repeat(60));
  console.log('💭 PART 4: Comment CRUD Operations');
  console.log('='.repeat(60));

  // Create comment
  const commentId = await runTest('createComment', () => testCreateComment(postId));
  if (!commentId) {
    console.log('❌ Failed to create comment, skipping remaining comment tests');
    return null;
  }

  // Read comment
  await runTest('getComment (verify create)', () => testGetComment(commentId));

  // Update comment
  await runTest('updateComment', () => testUpdateComment(commentId));

  // Verify update
  await runTest('getComment (verify update)', () => testGetComment(commentId));

  // List comments for this post
  await runTest('listComments (for post)', () => testListComments(postId));

  return commentId;
}

async function runActivityTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PART 5: User Activity');
  console.log('='.repeat(60));

  if (currentUserId) {
    await runTest('fetchUserActivity', () => testFetchUserActivity(currentUserId!));
  } else {
    console.log('❌ No user ID available for activity test');
  }
}

async function runCleanupTests(topicId: string | null, postId: string | null, commentId: string | null) {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 PART 6: Cleanup (Delete Test Data)');
  console.log('='.repeat(60));

  // Delete in reverse order of creation (comments -> posts -> topics)
  if (commentId) await runTest('deleteComment', () => testDeleteComment(commentId));
  if (postId) await runTest('deletePost', () => testDeletePost(postId));
  if (topicId) await runTest('deleteTopic', () => testDeleteTopic(topicId));
}

// ============================================================
// Main Entry Point
// ============================================================
async function runAllTests() {
  console.log('🚀 Starting Discussions App Test Script\n');
  console.log('This script tests:');
  console.log('  1. GraphQL Queries (Topics, Posts, Comments)');
  console.log('  2. Topic CRUD Operations');
  console.log('  3. Post CRUD Operations');
  console.log('  4. Comment CRUD Operations');
  console.log('  5. User Activity Tracking');
  console.log('  6. Cleanup (Delete Test Data)');

  // Check credentials
  if (TEST_USER.username === 'YOUR_USERNAME_HERE') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    console.log('   Edit the TEST_USER object at the top of this file.');
    return;
  }

  // Part 1: Query tests (may work without auth depending on schema)
  await runQueryTests();

  // Authenticate for mutation tests
  const isAuthenticated = await authenticateUser();
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run mutation tests without authentication');
    console.log('   Please check your TEST_USER credentials');
    printSummary();
    return;
  }

  // Part 2: Topic mutations
  const topicId = await runTopicMutationTests();

  // Part 3: Post mutations (requires topic)
  let postId: string | null = null;
  if (topicId) {
    postId = await runPostMutationTests(topicId);
  }

  // Part 4: Comment mutations (requires post)
  let commentId: string | null = null;
  if (postId) {
    commentId = await runCommentMutationTests(postId);
  }

  // Part 5: Activity tests
  await runActivityTests();

  // Part 6: Cleanup
  await runCleanupTests(topicId, postId, commentId);

  // Sign out
  await signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

// Run all tests
void runAllTests();
