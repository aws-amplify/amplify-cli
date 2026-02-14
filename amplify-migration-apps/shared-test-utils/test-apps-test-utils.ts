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
  message: string;
  stack?: string;
}

export interface TestUser {
  username: string;
  password: string;
  email?: string;
  phoneNumber?: string;
}

export interface TestCredentials {
  email: string;
  phoneNumber: string;
  username: string;
  password: string;
}

interface ResolvedAuthConfig {
  signinIdentifier: SigninIdentifier;
  signupAttributes: SignupAttribute[];
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

  // When phone or username is used as the SignUp Username, Cognito already
  // associates it with the user, so including it again in UserAttributes
  // would be redundant. Email is the exception — Cognito requires it in
  // UserAttributes for verification even when it's also the Username.
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

export class TestRunner {
  readonly failures: TestFailure[] = [];

  async runTest<T>(name: string, testFn: () => Promise<T>): Promise<T | null> {
    try {
      const result = await testFn();
      return result;
    } catch (error: unknown) {
      const stack = error instanceof Error ? error.stack : undefined;
      this.failures.push({ name, message: getErrorMessage(error), stack });
      return null;
    }
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));

    if (this.failures.length === 0) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log(`\n❌ ${this.failures.length} test(s) failed:\n`);
      this.failures.forEach((f) => {
        console.log(`  • ${f.name}`);
        console.log(`    Error: ${f.message}`);
        if (f.stack) {
          console.log(`    Stack: ${f.stack}`);
        }
        console.log('');
      });
      process.exit(1);
    }
  }
}

/**
 * Creates a test user via Cognito signup, admin-confirms them, and signs them in.
 * Returns the credentials for the authenticated user.
 */
export async function createTestUser(config: AmplifyConfig, credentials: TestCredentials): Promise<TestUser> {
  const { aws_user_pools_id: userPoolId, aws_user_pools_web_client_id: clientId, aws_cognito_region: region } = config;

  // Apply defaults for backwards compatibility: omitting these fields gives email-only behavior
  const resolved: ResolvedAuthConfig = {
    signinIdentifier: config.signinIdentifier ?? 'email',
    signupAttributes: config.signupAttributes ?? ['email'],
  };
  const { signupAttributes } = resolved;

  const signUpInput = buildSignUpInput(clientId ?? '', resolved, credentials);

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
    await signIn({ username: signinValue, password: credentials.password });
    const currentUser = await getCurrentUser();
    console.log(`✅ Signed in as: ${currentUser.username}`);
  } catch (error) {
    console.error('❌ SignIn failed:', getErrorMessage(error));
    return process.exit(1);
  }

  // Build TestUser with fields based on signupAttributes
  const testUser: TestUser = {
    username: signinValue,
    password: credentials.password,
  };

  if (signupAttributes.includes('email')) {
    testUser.email = credentials.email;
  }
  if (signupAttributes.includes('phone')) {
    testUser.phoneNumber = credentials.phoneNumber;
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
