import { signIn, signOut, getCurrentUser } from 'aws-amplify/auth';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  AdminConfirmSignUpCommand,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';

export type SigninIdentifier = 'email' | 'phone' | 'username';

export type SignupAttribute = 'email' | 'phone' | 'username';

export interface AmplifyConfig {
  aws_user_pools_id?: string;
  aws_user_pools_web_client_id?: string;
  aws_cognito_region?: string;
  signinIdentifier?: SigninIdentifier;
  signupAttributes?: SignupAttribute[];
}

export interface TestFailure {
  name: string;
  error: string;
}

export interface TestUser {
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
}

const TEST_PASSWORD = 'Password1!';

function resolveAuthConfig(config: AmplifyConfig): { signinIdentifier: SigninIdentifier; signupAttributes: SignupAttribute[] } {
  return {
    signinIdentifier: config.signinIdentifier ?? 'email',
    signupAttributes: config.signupAttributes ?? ['email'],
  };
}

function generateTestEmail(): string {
  return 'user1@test.example.com';
}

function generateTestPhoneNumber(): string {
  return '+15551234567';
}

function generateTestUsername(): string {
  return 'testuser1';
}

function buildSignUpInput(
  config: AmplifyConfig,
  credentials: { email: string; phoneNumber: string; username: string; password: string },
): { ClientId: string; Username: string; Password: string; UserAttributes: AttributeType[] } {
  const { signinIdentifier, signupAttributes } = resolveAuthConfig(config);
  const clientId = config.aws_user_pools_web_client_id ?? '';

  const identifierValueMap: Record<SigninIdentifier, string> = {
    email: credentials.email,
    phone: credentials.phoneNumber,
    username: credentials.username,
  };
  const username = identifierValueMap[signinIdentifier];

  const attributeMap: Record<SignupAttribute, AttributeType> = {
    email: { Name: 'email', Value: credentials.email },
    phone: { Name: 'phone_number', Value: credentials.phoneNumber },
    username: { Name: 'username', Value: credentials.username },
  };

  const userAttributes: AttributeType[] = signupAttributes
    .filter((attr) => {
      // When signinIdentifier is phone or username, that value is already
      // carried in the Username field, so exclude it from UserAttributes.
      if (signinIdentifier === 'phone' && attr === 'phone') return false;
      if (signinIdentifier === 'username' && attr === 'username') return false;
      return true;
    })
    .map((attr) => attributeMap[attr]);

  return {
    ClientId: clientId,
    Username: username,
    Password: credentials.password,
    UserAttributes: userAttributes,
  };
}

export function createTestRunner() {
  const failures: TestFailure[] = [];

  async function runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: unknown) {
      // Handle different error formats (GraphQL errors, standard errors, objects)
      let errorMessage: string;
      const err = error as Record<string, unknown>;
      const errors = err?.errors as Array<{ message?: string }> | undefined;
      if (errors?.[0]?.message) {
        // GraphQL error format
        errorMessage = errors[0].message;
      } else if (error instanceof Error) {
        // Standard Error
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
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
  const { aws_user_pools_id: userPoolId, aws_cognito_region: region } = config;
  const { signinIdentifier, signupAttributes } = resolveAuthConfig(config);

  const email = generateTestEmail();
  const phoneNumber = generateTestPhoneNumber();
  const username = generateTestUsername();
  const password = TEST_PASSWORD;

  const signUpInput = buildSignUpInput(config, { email, phoneNumber, username, password });

  console.log(`\n🔑 Creating and authenticating test user: ${signUpInput.Username}`);

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  // Step 1: SignUp
  try {
    await cognitoClient.send(new SignUpCommand(signUpInput));
    console.log('✅ SignUp succeeded');
  } catch (error) {
    console.error('❌ SignUp failed:', error instanceof Error ? error.message : String(error));
    return process.exit(1);
  }

  // Step 2: AdminConfirmSignUp
  try {
    await cognitoClient.send(
      new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: signUpInput.Username,
      }),
    );
    console.log('✅ AdminConfirmSignUp succeeded');
  } catch (error) {
    console.error('❌ AdminConfirmSignUp failed:', error instanceof Error ? error.message : String(error));
    return process.exit(1);
  }

  // Step 3: SignIn
  const identifierValueMap: Record<SigninIdentifier, string> = {
    email,
    phone: phoneNumber,
    username,
  };
  const signinValue = identifierValueMap[signinIdentifier];

  try {
    await signIn({ username: signinValue, password });
    const currentUser = await getCurrentUser();
    console.log(`✅ Signed in as: ${currentUser.username}`);
  } catch (error) {
    console.error('❌ SignIn failed:', error instanceof Error ? error.message : String(error));
    return process.exit(1);
  }

  // Build TestUser with fields based on signupAttributes
  const testUser: TestUser = {
    username: signinValue,
    password,
  };

  if (signupAttributes.includes('email')) {
    testUser.email = email;
  }
  if (signupAttributes.includes('phone')) {
    testUser.phoneNumber = phoneNumber;
  }

  return testUser;
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
