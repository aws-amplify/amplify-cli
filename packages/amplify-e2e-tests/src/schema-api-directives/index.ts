import path from 'path';
import fs from 'fs-extra';
import { runTest, runAutTest } from './common';
import { runFunctionTest } from './functionTester';

//The contents in the test files might be modified from its original version in the Amplify CLI doc,
//and mutations or queries might be added to test the input schema.
//Modification are marked in the test file:
//#change: modified the original content, such as adding the missing pieces in imcomplete schemas, etc.
//#error: corrected error in the original content
//#extra: the content does not exist in the Amplify CLI document, added for the completeness of the testing, such as the mutation needed to test subscriptions

// to deal with bug in cognito-identity-js
(global as any).fetch = require('node-fetch');
// to deal with subscriptions in node env
(global as any).WebSocket = require('ws');

export async function testSchema(projectDir: string, directive: string, section: string): Promise<boolean> {
  let testModule;

  const testFilePath = path.join(__dirname, `/tests/${directive}-${section}.ts`);
  if (!fs.existsSync(testFilePath)) {
    throw new Error(`Missing test file ${directive}-${section}.ts`);
  }

  try {
    testModule = await import(testFilePath);
  } catch {
    throw new Error(`Unable to load test file ${directive}-${section}.ts`);
  }

  try {
    if (testModule.runTest) {
      await testModule.runTest(projectDir, testModule);
    } else {
      switch (directive) {
        case 'auth':
          await runAutTest(projectDir, testModule);
          break;
        case 'function':
          await runFunctionTest(projectDir, testModule);
          break;
        default:
          await runTest(projectDir, testModule);
          break;
      }
    }
    return true;
  } catch (err) {
    console.log(`Test failed for ${directive}-${section}`);
    if (testModule && testModule.schema) {
      console.log(`Input schema: ${testModule.schema}`);
    }
    console.log(err);
    return false;
  }
}
