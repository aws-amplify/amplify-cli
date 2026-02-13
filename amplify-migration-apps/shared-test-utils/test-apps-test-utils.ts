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

interface ResolvedAuthConfig {
  signinIdentifier: SigninIdentifier;
  signupAttributes: SignupAttribute[];
}

const TEST_PASSWORD = 'Password1!';
const TEST_EMAIL = 'user1@test.example.com';
const TEST_PHONE_NUMBER = '+15551234567';
const TEST_USERNAME = 'testuser1';

function resolveAuthConfig(config: AmplifyConfig): ResolvedAuthConfig {
  return {
    signinIdentifier: config.signinIdentifier ?? 'email',
    signupAttributes: config.signupAttributes ?? ['email'],
  };
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
    // Handle GraphQL-style errors: { errors: [{ message: "..." }] }
    if ('errors' in error) {
      const gqlErrors = (error as { errors: unknown }).errors;
      if (Array.isArray(gqlErrors) && gqlErrors.length > 0) {
        const first = gqlErrors[0] as { message?: string };
        if (typeof first.message === 'string') {
          return first.message;
        }
      }
    }
    return JSON.stringify(error, null, 2);
  }
  return String(error);
}

function buildSignUpInput(
  clientId: string,
  resolved: ResolvedAuthConfig,
  credentials: { email: string; phoneNumber: string; username: string; password: string },
): { ClientId: string; Username: string; Password: string; UserAttributes: AttributeType[] } {
  const { signinIdentifier, signupAttributes } = resolved;

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

  // Cognito requires email in UserAttributes even when it's also the Username.
  // Only phone/username are excluded since Cognito treats them as implicit
  // when they appear in the Username field.
  const userAttributes: AttributeType[] = signupAttributes
    .filter((attr) => {
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

export function createTestRunner(): {
  failures: TestFailure[];
  runTest: <T>(name: string, testFn: () => Promise<T>) => Promise<T | null>;
  printSummary: () => void;
} {
  const failures: TestFailure[] = [];

  async function runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: unknown) {
      failures.push({ name, error: getErrorMessage(error) });
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

  const resolved = resolveAuthConfig(config);
  const { signupAttributes } = resolved;

  const signUpInput = buildSignUpInput(clientId ?? '', resolved, {
    email: TEST_EMAIL,
    phoneNumber: TEST_PHONE_NUMBER,
    username: TEST_USERNAME,
    password: TEST_PASSWORD,
  });

  const signinValue = signUpInput.Username;

  console.log(`\n🔑 Creating and authenticating test user: ${signUpInput.Username}`);

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  // Step 1: SignUp
  try {
    await cognitoClient.send(new SignUpCommand(signUpInput));
    console.log('✅ SignUp succeeded');
  } catch (error) {
    console.error('❌ SignUp failed:', getErrorMessage(error));
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
    console.error('❌ AdminConfirmSignUp failed:', getErrorMessage(error));
    return process.exit(1);
  }

  // Step 3: SignIn
  try {
    await signIn({ username: signinValue, password: TEST_PASSWORD });
    const currentUser = await getCurrentUser();
    console.log(`✅ Signed in as: ${currentUser.username}`);
  } catch (error) {
    console.error('❌ SignIn failed:', getErrorMessage(error));
    return process.exit(1);
  }

  // Build TestUser with fields based on signupAttributes
  const testUser: TestUser = {
    username: signinValue,
    password: TEST_PASSWORD,
  };

  if (signupAttributes.includes('email')) {
    testUser.email = TEST_EMAIL;
  }
  if (signupAttributes.includes('phone')) {
    testUser.phoneNumber = TEST_PHONE_NUMBER;
  }

  return testUser;
}

export async function signOutUser(): Promise<void> {
  console.log('\n🚪 Signing out...');
  try {
    await signOut();
    console.log('✅ Signed out successfully');
  } catch (error) {
    console.error('❌ Sign out error:', getErrorMessage(error));
  }
}
