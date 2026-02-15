// test-utils.ts
/**
 * Shared test utilities for Discussions Gen1 and Gen2 test scripts
 */

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
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
import { TestRunner } from '../shared-test-utils/test-apps-test-utils';
import amplifyconfig from './src/amplifyconfiguration.json';

// Configure Amplify in this module to ensure api singletons see the config
Amplify.configure(amplifyconfig);

// ============================================================
// Shared Test Functions Factory
// ============================================================

export function createTestFunctions() {
  function getAuthClient() {
    return generateClient();
  }

  function getPublicClient() {
    return generateClient({ authMode: 'apiKey' });
  }

  async function getCurrentUserId(): Promise<string | null> {
    try {
      const user = await getCurrentUser();
      return user.userId;
    } catch {
      return null;
    }
  }

  // ============================================================
  // Query Test Functions
  // ============================================================

  async function testListTopics(): Promise<string | null> {
    console.log('\n📋 Testing listTopics...');
    const client = getAuthClient();
    const result = await client.graphql({ query: listTopics });
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
    const client = getAuthClient();
    const result = await client.graphql({
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
    const client = getAuthClient();
    const variables: any = {};
    if (topicId) {
      variables.filter = { topicPostsId: { eq: topicId } };
      console.log(`   Filtering by topic: ${topicId.substring(0, 8)}...`);
    }

    const result = await client.graphql({ query: listPosts, variables });
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
    const client = getAuthClient();
    const result = await client.graphql({
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
    const client = getAuthClient();
    const variables: any = {};
    if (postId) {
      variables.filter = { postCommentsId: { eq: postId } };
      console.log(`   Filtering by post: ${postId.substring(0, 8)}...`);
    }

    const result = await client.graphql({ query: listComments, variables });
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
    const client = getAuthClient();
    const result = await client.graphql({
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
    const client = getAuthClient();
    const result = await client.graphql({
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
  // Mutation Test Functions - Topics
  // ============================================================

  async function testCreateTopic(): Promise<string | null> {
    console.log('\n🆕 Testing createTopic...');
    const publicClient = getPublicClient();
    const userId = await getCurrentUserId();

    const topicName = `Test Topic ${Date.now()}`;
    const content = `tech:${topicName}`;

    const result = await publicClient.graphql({
      query: createTopic,
      variables: {
        input: {
          content,
          createdByUserId: userId,
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
    const publicClient = getPublicClient();

    const result = await publicClient.graphql({
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
    const publicClient = getPublicClient();

    const result = await publicClient.graphql({
      query: deleteTopic,
      variables: { input: { id: topicId } },
    });
    const deleted = (result as any).data.deleteTopic;
    console.log('✅ Deleted topic:', deleted.content);
  }

  // ============================================================
  // Mutation Test Functions - Posts
  // ============================================================

  async function testCreatePost(topicId: string): Promise<string | null> {
    console.log('\n🆕 Testing createPost...');
    const publicClient = getPublicClient();
    const userId = await getCurrentUserId();

    const result = await publicClient.graphql({
      query: createPost,
      variables: {
        input: {
          content: `This is a test post created at ${new Date().toISOString()}. Testing the discussions app functionality!`,
          topicPostsId: topicId,
          createdByUserId: userId,
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
    const publicClient = getPublicClient();

    const result = await publicClient.graphql({
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
    const publicClient = getPublicClient();

    const result = await publicClient.graphql({
      query: deletePost,
      variables: { input: { id: postId } },
    });
    const deleted = (result as any).data.deletePost;
    console.log('✅ Deleted post:', deleted.content?.substring(0, 30) + '...');
  }

  // ============================================================
  // Mutation Test Functions - Comments
  // ============================================================

  async function testCreateComment(postId: string): Promise<string | null> {
    console.log('\n🆕 Testing createComment...');
    const publicClient = getPublicClient();
    const userId = await getCurrentUserId();

    const result = await publicClient.graphql({
      query: createComment,
      variables: {
        input: {
          content: `This is a test comment created at ${new Date().toISOString()}`,
          postCommentsId: postId,
          createdByUserId: userId,
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
    const publicClient = getPublicClient();

    const result = await publicClient.graphql({
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
    const publicClient = getPublicClient();

    const result = await publicClient.graphql({
      query: deleteComment,
      variables: { input: { id: commentId } },
    });
    const deleted = (result as any).data.deleteComment;
    console.log('✅ Deleted comment:', deleted.content?.substring(0, 30) + '...');
  }

  return {
    getCurrentUserId,
    testListTopics,
    testGetTopic,
    testListPosts,
    testGetPost,
    testListComments,
    testGetComment,
    testFetchUserActivity,
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
// Shared Test Orchestration Functions
// ============================================================

export function createTestOrchestrator(testFunctions: ReturnType<typeof createTestFunctions>, runner: TestRunner) {
  async function runQueryTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📖 PART 1: GraphQL Queries');
    console.log('='.repeat(60));

    // Test Topics
    const topicId = await runner.runTest('listTopics', testFunctions.testListTopics);
    if (topicId) await runner.runTest('getTopic', () => testFunctions.testGetTopic(topicId));

    // Test Posts
    const postId = await runner.runTest('listPosts', testFunctions.testListPosts);
    if (postId) await runner.runTest('getPost', () => testFunctions.testGetPost(postId));

    // Test Posts filtered by topic
    if (topicId) {
      console.log('\n--- Testing posts filtered by topic ---');
      await runner.runTest('listPostsByTopic', () => testFunctions.testListPosts(topicId));
    }

    // Test Comments
    const commentId = await runner.runTest('listComments', testFunctions.testListComments);
    if (commentId) await runner.runTest('getComment', () => testFunctions.testGetComment(commentId));

    // Test Comments filtered by post
    if (postId) {
      console.log('\n--- Testing comments filtered by post ---');
      await runner.runTest('listCommentsByPost', () => testFunctions.testListComments(postId));
    }
  }

  async function runTopicMutationTests(): Promise<string | null> {
    console.log('\n' + '='.repeat(60));
    console.log('📝 PART 2: Topic CRUD Operations');
    console.log('='.repeat(60));

    const topicId = await runner.runTest('createTopic', testFunctions.testCreateTopic);
    if (!topicId) {
      console.log('❌ Failed to create topic, skipping remaining topic tests');
      return null;
    }

    await runner.runTest('getTopic (verify create)', () => testFunctions.testGetTopic(topicId));
    await runner.runTest('updateTopic', () => testFunctions.testUpdateTopic(topicId));
    await runner.runTest('getTopic (verify update)', () => testFunctions.testGetTopic(topicId));

    return topicId;
  }

  async function runPostMutationTests(topicId: string): Promise<string | null> {
    console.log('\n' + '='.repeat(60));
    console.log('💬 PART 3: Post CRUD Operations');
    console.log('='.repeat(60));

    const postId = await runner.runTest('createPost', () => testFunctions.testCreatePost(topicId));
    if (!postId) {
      console.log('❌ Failed to create post, skipping remaining post tests');
      return null;
    }

    await runner.runTest('getPost (verify create)', () => testFunctions.testGetPost(postId));
    await runner.runTest('updatePost', () => testFunctions.testUpdatePost(postId));
    await runner.runTest('getPost (verify update)', () => testFunctions.testGetPost(postId));
    await runner.runTest('listPosts (for topic)', () => testFunctions.testListPosts(topicId));

    return postId;
  }

  async function runCommentMutationTests(postId: string): Promise<string | null> {
    console.log('\n' + '='.repeat(60));
    console.log('💭 PART 4: Comment CRUD Operations');
    console.log('='.repeat(60));

    const commentId = await runner.runTest('createComment', () => testFunctions.testCreateComment(postId));
    if (!commentId) {
      console.log('❌ Failed to create comment, skipping remaining comment tests');
      return null;
    }

    await runner.runTest('getComment (verify create)', () => testFunctions.testGetComment(commentId));
    await runner.runTest('updateComment', () => testFunctions.testUpdateComment(commentId));
    await runner.runTest('getComment (verify update)', () => testFunctions.testGetComment(commentId));
    await runner.runTest('listComments (for post)', () => testFunctions.testListComments(postId));

    return commentId;
  }

  async function runActivityTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PART 5: User Activity');
    console.log('='.repeat(60));

    const currentUserId = await testFunctions.getCurrentUserId();
    if (currentUserId) {
      await runner.runTest('fetchUserActivity', () => testFunctions.testFetchUserActivity(currentUserId));
    } else {
      console.log('❌ No user ID available for activity test');
    }
  }

  async function runCleanupTests(topicId: string | null, postId: string | null, commentId: string | null): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🧹 PART 6: Cleanup (Delete Test Data)');
    console.log('='.repeat(60));

    // Delete in reverse order of creation (comments -> posts -> topics)
    if (commentId) await runner.runTest('deleteComment', () => testFunctions.testDeleteComment(commentId));
    if (postId) await runner.runTest('deletePost', () => testFunctions.testDeletePost(postId));
    if (topicId) await runner.runTest('deleteTopic', () => testFunctions.testDeleteTopic(topicId));
  }

  return {
    runQueryTests,
    runTopicMutationTests,
    runPostMutationTests,
    runCommentMutationTests,
    runActivityTests,
    runCleanupTests,
  };
}
