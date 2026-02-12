import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import { CognitoIdentityProviderClient, SignUpCommand, AdminConfirmSignUpCommand } from '@aws-sdk/client-cognito-identity-provider';

export interface AmplifyConfig {
  aws_user_pools_id?: string;
  aws_user_pools_web_client_id?: string;
  aws_cognito_region?: string;
}

export interface TestFailure {
  name: string;
  error: string;
}

export interface TestUser {
  username: string;
  password: string;
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

/**
 * Creates a test user via Cognito signup, admin-confirms them, and signs them in.
 * Returns the credentials for the authenticated user.
 */
export async function createTestUser(config: AmplifyConfig): Promise<TestUser> {
  const { aws_user_pools_id: userPoolId, aws_user_pools_web_client_id: clientId, aws_cognito_region: region } = config;

  const uniqueId = 'user1';
  const password = 'Password1!';
  const email = `${uniqueId}@test.example.com`;

  console.log(`\n🔑 Creating and authenticating test user: ${email}`);

  try {
    const cognitoClient = new CognitoIdentityProviderClient({ region });

    await cognitoClient.send(
      new SignUpCommand({
        ClientId: clientId,
        Username: email,
        Password: password,
        UserAttributes: [{ Name: 'email', Value: email }],
      }),
    );
    console.log('✅ SignUp succeeded');

    await cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: email,
      }),
    );
    console.log('✅ AdminConfirmSignUp succeeded');

    // Sign in the newly created user
    await signIn({ username: email, password });
    const user = await getCurrentUser();
    console.log(`✅ Signed in as: ${user.username}`);

    return { username: email, password };
  } catch (error) {
    console.error('❌ Failed to create/authenticate test user:', error instanceof Error ? error.message : error);
    return process.exit(1);
  }
}

export async function signOutUser(): Promise<void> {
  console.log('\n🚪 Signing out...');
  try {
    await signOut();
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.log('❌ Sign out error:', error);
  }
}
