// test-utils.ts

import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/api';
import { getCurrentUser } from 'aws-amplify/auth';
import { uploadData, getUrl } from 'aws-amplify/storage';
import * as fs from 'fs';
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

// Categories matching App.tsx
const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Other'];

// ============================================================
// Shared Test Functions Factory
// ============================================================

export interface TestFunctionsOptions {
  /**
   * Override the auth mode used for the GraphQL client.
   * Gen1 uses explicit 'userPool' auth; Gen2 (IAM) can pass undefined
   * so generateClient() picks up the default from the Amplify config.
   */
  authMode?: 'apiKey' | 'userPool' | 'iam';
}

export function createTestFunctions(options?: TestFunctionsOptions) {
  const authMode = options?.authMode;

  function getClient() {
    return authMode ? generateClient({ authMode }) : generateClient();
  }
