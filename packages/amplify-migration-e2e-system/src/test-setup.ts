// @ts-nocheck
/**
 * Jest Test Setup
 * Automatically loads environment variables from .gamma.env for all tests, if the file is present
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import nodeFetch from 'node-fetch';

// Polyfill fetch APIs for Node.js (required by @cdklabs/cdk-atmosphere-client)
// Node 18+ has these but they may not be globally available in all contexts
if (typeof globalThis.fetch === 'undefined') {
  globalThis.fetch = nodeFetch.default || nodeFetch;
  globalThis.Request = nodeFetch.Request;
  globalThis.Response = nodeFetch.Response;
  globalThis.Headers = nodeFetch.Headers;
}

// Load environment variables from .gamma.env file
const envPath = path.join(__dirname, '..', '.gamma.env');
dotenv.config({ path: envPath });

// Log loaded environment variables for debugging
console.log('Test Environment Configuration:');
console.log('- ATMOSPHERE_ENDPOINT:', process.env.ATMOSPHERE_ENDPOINT || 'not set');
console.log('- DEFAULT_POOL:', process.env.DEFAULT_POOL || 'not set');
