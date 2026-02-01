/**
 * Gen1 Test Script for Discussions App
 *
 * This script tests all functionality for Gen1 Amplify configuration.
 * IMPORTANT: Update TEST_USER credentials before running authenticated tests.
 */

// Polyfill crypto for Node.js environment (required for Amplify Auth)
import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

import { Amplify } from 'aws-amplify';
import amplifyconfig from './src/amplifyconfiguration.json';
import { createTestRunner, runAllTests } from './test-utils';
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

// Configure Amplify with Gen1 configuration
Amplify.configure(amplifyconfig);

// ============================================================
// CONFIGURATION - Update with your test user credentials
// ============================================================
const TEST_USER = {
  username: 'YOUR_USERNAME_HERE', // Phone number format
  password: 'YOUR_PASSWORD_HERE',
};

// ============================================================
// Main Entry Point
// ============================================================
const { runTest, printSummary } = createTestRunner();

void runAllTests({
  queries: {
    getTopic,
    listTopics,
    getPost,
    listPosts,
    getComment,
    listComments,
    fetchUserActivity,
  },
  mutations: {
    createTopic,
    updateTopic,
    deleteTopic,
    createPost,
    updatePost,
    deletePost,
    createComment,
    updateComment,
    deleteComment,
  },
  testUser: TEST_USER,
  runTest,
  printSummary,
});
