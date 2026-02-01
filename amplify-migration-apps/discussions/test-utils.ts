// test-utils.ts

import { generateClient } from 'aws-amplify/api';
import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';

export interface TestFailure {
  name: string;
  error: string;
}

export interface TestUser {
  username: string;
  password: string;
}

export interface GraphQLQueries {
  getTopic: string;
  listTopics: string;
  getPost: string;
  listPosts: string;
  getComment: string;
  listComments: string;
  fetchUserActivity: string;
}

export interface GraphQLMutations {
  createTopic: string;
  updateTopic: string;
  deleteTopic: string;
  createPost: string;
  updatePost: string;
  deletePost: string;
  createComment: string;
  updateComment: string;
  deleteComment: string;
}

export function createTestRunner() {
  const failures: TestFailure[] = [];

  async function runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: any) {
      // Handle different error formats (GraphQL errors, standard errors, objects)
      let errorMessage: string;

      if (error.errors?.[0]?.message) {
        // GraphQL error format
        errorMessage = error.errors[0].message;
      } else if (error.message) {
        // Standard Error
        errorMessage = error.message;
      } else if (typeof error === 'object') {
        // Generic object - stringify it
        errorMessage = JSON.stringify(error, null, 2);
      } else {
        errorMessage = String(error);
      }

      failures.push({ name, error: errorMessage });
      return null;
    }
  }

  function printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    if (failures.length === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ ${failures.length} test(s) failed:\n`);
      failures.forEach((f) => {
        console.log(`  • ${f.name}`);
        console.log(`    Error: ${f.error}\n`);
      });
      process.exit(1);
    }
  }

  return { failures, runTest, printSummary };
}

// ============================================================
// Authentication Helper Functions
// ============================================================
export function createAuthHelpers(testUser: TestUser) {
  let currentUserId: string | null = null;

  async function authenticateUser(): Promise<boolean> {
    console.log('\n🔐 Authenticating user...');
    try {
      await signIn({
        username: testUser.username,
        password: testUser.password,
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

  function getCurrentUserId(): string | null {
    return currentUserId;
  }

  return { authenticateUser, signOutUser, getCurrentUserId };
}

// ============================================================
// Query Test Functions
// ============================================================
export function createQueryTests(queries: GraphQLQueries) {
  const authClient = generateClient();

  async function testListTopics(): Promise<string | null> {
    console.log('\n📋 Testing listTopics...');
    const result = await authClient.graphql({ query: queries.listTopics });
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
    const result = await authClient.graphql({
      query: queries.getTopic,
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

    const result = await authClient.graphql({ query: queries.listPosts, variables });
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
    const result = await authClient.graphql({
      query: queries.getPost,
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

    const result = await authClient.graphql({ query: queries.listComments, variables });
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
    const result = await authClient.graphql({
      query: queries.getComment,
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
    const result = await authClient.graphql({
      query: queries.fetchUserActivity,
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

  return {
    testListTopics,
    testGetTopic,
    testListPosts,
    testGetPost,
    testListComments,
    testGetComment,
    testFetchUserActivity,
  };
}

// ============================================================
// Mutation Test Functions
// ============================================================
export function createMutationTests(mutations: GraphQLMutations, getCurrentUserId: () => string | null) {
  async function testCreateTopic(discussionId: string = 'tech'): Promise<string | null> {
    console.log('\n🆕 Testing createTopic...');
    const publicClient = generateClient({ authMode: 'apiKey' });

    const topicName = `Test Topic ${Date.now()}`;
    const content = `${discussionId}:${topicName}`;

    const result = await publicClient.graphql({
      query: mutations.createTopic,
      variables: {
        input: {
          content,
          createdByUserId: getCurrentUserId(),
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
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.updateTopic,
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
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.deleteTopic,
      variables: { input: { id: topicId } },
    });
    const deleted = (result as any).data.deleteTopic;
    console.log('✅ Deleted topic:', deleted.content);
  }

  async function testCreatePost(topicId: string): Promise<string | null> {
    console.log('\n🆕 Testing createPost...');
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.createPost,
      variables: {
        input: {
          content: `This is a test post created at ${new Date().toISOString()}. Testing the discussions app functionality!`,
          topicPostsId: topicId,
          createdByUserId: getCurrentUserId(),
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
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.updatePost,
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
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.deletePost,
      variables: { input: { id: postId } },
    });
    const deleted = (result as any).data.deletePost;
    console.log('✅ Deleted post:', deleted.content?.substring(0, 30) + '...');
  }

  async function testCreateComment(postId: string): Promise<string | null> {
    console.log('\n🆕 Testing createComment...');
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.createComment,
      variables: {
        input: {
          content: `This is a test comment created at ${new Date().toISOString()}`,
          postCommentsId: postId,
          createdByUserId: getCurrentUserId(),
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
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.updateComment,
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
    const publicClient = generateClient({ authMode: 'apiKey' });

    const result = await publicClient.graphql({
      query: mutations.deleteComment,
      variables: { input: { id: commentId } },
    });
    const deleted = (result as any).data.deleteComment;
    console.log('✅ Deleted comment:', deleted.content?.substring(0, 30) + '...');
  }

  return {
    testCreateTopic,
    testUpdateTopic,
    testDeleteTopic,
    testCreatePost,
    testUpdatePost,
    testDeletePost,
    testCreateComment,
    testUpdateComment,
    testDeleteComment,
  };
}

// ============================================================
// Test Orchestration
// ============================================================
export interface TestContext {
  queries: GraphQLQueries;
  mutations: GraphQLMutations;
  testUser: TestUser;
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>;
  printSummary: () => void;
}

export async function runAllTests(context: TestContext): Promise<void> {
  const { queries, mutations, testUser, runTest, printSummary } = context;

  console.log('🚀 Starting Discussions App Test Script\n');
  console.log('This script tests:');
  console.log('  1. GraphQL Queries (Topics, Posts, Comments)');
  console.log('  2. Topic CRUD Operations');
  console.log('  3. Post CRUD Operations');
  console.log('  4. Comment CRUD Operations');
  console.log('  5. User Activity Tracking');
  console.log('  6. Cleanup (Delete Test Data)');

  // Check credentials
  if (testUser.username === 'YOUR_USERNAME_HERE') {
    console.log('\n⚠️  Please update TEST_USER credentials before running!');
    console.log('   Edit the TEST_USER object at the top of this file.');
    return;
  }

  // Create test helpers
  const authHelpers = createAuthHelpers(testUser);
  const queryTests = createQueryTests(queries);
  const mutationTests = createMutationTests(mutations, authHelpers.getCurrentUserId);

  // Part 1: Query tests
  await runQueryTests(queryTests, runTest);

  // Authenticate for mutation tests
  const isAuthenticated = await authHelpers.authenticateUser();
  if (!isAuthenticated) {
    console.log('\n❌ Cannot run mutation tests without authentication');
    console.log('   Please check your TEST_USER credentials');
    printSummary();
    return;
  }

  // Part 2: Topic mutations
  const topicId = await runTopicMutationTests(mutationTests, queryTests, runTest);

  // Part 3: Post mutations (requires topic)
  let postId: string | null = null;
  if (topicId) {
    postId = await runPostMutationTests(mutationTests, queryTests, topicId, runTest);
  }

  // Part 4: Comment mutations (requires post)
  let commentId: string | null = null;
  if (postId) {
    commentId = await runCommentMutationTests(mutationTests, queryTests, postId, runTest);
  }

  // Part 5: Activity tests
  await runActivityTests(queryTests, authHelpers.getCurrentUserId, runTest);

  // Part 6: Cleanup
  await runCleanupTests(mutationTests, topicId, postId, commentId, runTest);

  // Sign out
  await authHelpers.signOutUser();

  // Print summary and exit with appropriate code
  printSummary();
}

async function runQueryTests(
  queryTests: ReturnType<typeof createQueryTests>,
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>,
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📖 PART 1: GraphQL Queries');
  console.log('='.repeat(60));

  // Test Topics
  const topicId = await runTest('listTopics', queryTests.testListTopics);
  if (topicId) await runTest('getTopic', () => queryTests.testGetTopic(topicId));

  // Test Posts
  const postId = await runTest('listPosts', queryTests.testListPosts);
  if (postId) await runTest('getPost', () => queryTests.testGetPost(postId));

  // Test Posts filtered by topic
  if (topicId) {
    console.log('\n--- Testing posts filtered by topic ---');
    await runTest('listPostsByTopic', () => queryTests.testListPosts(topicId));
  }

  // Test Comments
  const commentId = await runTest('listComments', queryTests.testListComments);
  if (commentId) await runTest('getComment', () => queryTests.testGetComment(commentId));

  // Test Comments filtered by post
  if (postId) {
    console.log('\n--- Testing comments filtered by post ---');
    await runTest('listCommentsByPost', () => queryTests.testListComments(postId));
  }
}

async function runTopicMutationTests(
  mutationTests: ReturnType<typeof createMutationTests>,
  queryTests: ReturnType<typeof createQueryTests>,
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>,
): Promise<string | null> {
  console.log('\n' + '='.repeat(60));
  console.log('📝 PART 2: Topic CRUD Operations');
  console.log('='.repeat(60));

  // Create topic
  const topicId = await runTest('createTopic', () => mutationTests.testCreateTopic('tech'));
  if (!topicId) {
    console.log('❌ Failed to create topic, skipping remaining topic tests');
    return null;
  }

  // Read topic
  await runTest('getTopic (verify create)', () => queryTests.testGetTopic(topicId));

  // Update topic
  await runTest('updateTopic', () => mutationTests.testUpdateTopic(topicId));

  // Verify update
  await runTest('getTopic (verify update)', () => queryTests.testGetTopic(topicId));

  return topicId;
}

async function runPostMutationTests(
  mutationTests: ReturnType<typeof createMutationTests>,
  queryTests: ReturnType<typeof createQueryTests>,
  topicId: string,
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>,
): Promise<string | null> {
  console.log('\n' + '='.repeat(60));
  console.log('💬 PART 3: Post CRUD Operations');
  console.log('='.repeat(60));

  // Create post
  const postId = await runTest('createPost', () => mutationTests.testCreatePost(topicId));
  if (!postId) {
    console.log('❌ Failed to create post, skipping remaining post tests');
    return null;
  }

  // Read post
  await runTest('getPost (verify create)', () => queryTests.testGetPost(postId));

  // Update post
  await runTest('updatePost', () => mutationTests.testUpdatePost(postId));

  // Verify update
  await runTest('getPost (verify update)', () => queryTests.testGetPost(postId));

  // List posts for this topic
  await runTest('listPosts (for topic)', () => queryTests.testListPosts(topicId));

  return postId;
}

async function runCommentMutationTests(
  mutationTests: ReturnType<typeof createMutationTests>,
  queryTests: ReturnType<typeof createQueryTests>,
  postId: string,
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>,
): Promise<string | null> {
  console.log('\n' + '='.repeat(60));
  console.log('💭 PART 4: Comment CRUD Operations');
  console.log('='.repeat(60));

  // Create comment
  const commentId = await runTest('createComment', () => mutationTests.testCreateComment(postId));
  if (!commentId) {
    console.log('❌ Failed to create comment, skipping remaining comment tests');
    return null;
  }

  // Read comment
  await runTest('getComment (verify create)', () => queryTests.testGetComment(commentId));

  // Update comment
  await runTest('updateComment', () => mutationTests.testUpdateComment(commentId));

  // Verify update
  await runTest('getComment (verify update)', () => queryTests.testGetComment(commentId));

  // List comments for this post
  await runTest('listComments (for post)', () => queryTests.testListComments(postId));

  return commentId;
}

async function runActivityTests(
  queryTests: ReturnType<typeof createQueryTests>,
  getCurrentUserId: () => string | null,
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>,
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('📊 PART 5: User Activity');
  console.log('='.repeat(60));

  const currentUserId = getCurrentUserId();
  if (currentUserId) {
    await runTest('fetchUserActivity', () => queryTests.testFetchUserActivity(currentUserId));
  } else {
    console.log('❌ No user ID available for activity test');
  }
}

async function runCleanupTests(
  mutationTests: ReturnType<typeof createMutationTests>,
  topicId: string | null,
  postId: string | null,
  commentId: string | null,
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>,
): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🧹 PART 6: Cleanup (Delete Test Data)');
  console.log('='.repeat(60));

  // Delete in reverse order of creation (comments -> posts -> topics)
  if (commentId) await runTest('deleteComment', () => mutationTests.testDeleteComment(commentId));
  if (postId) await runTest('deletePost', () => mutationTests.testDeletePost(postId));
  if (topicId) await runTest('deleteTopic', () => mutationTests.testDeleteTopic(topicId));
}
