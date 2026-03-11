import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  type AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { randomBytes } from 'crypto';
import type { AmplifyConfig, SigninIdentifier, SignupAttribute, TestUser } from './test-apps-test-utils';

interface ResolvedAuthConfig {
  signinIdentifier: SigninIdentifier;
  signupAttributes: SignupAttribute[];
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'object' && error !== null) {
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

function resolveSigninIdentifier(usernameAttributes: string[]): SigninIdentifier {
  if (usernameAttributes.includes('PHONE_NUMBER')) return 'phone';
  if (usernameAttributes.includes('EMAIL')) return 'email';
  return 'username';
}

function resolveSignupAttributes(signupAttributes: string[]): SignupAttribute[] {
  const mapping: Record<string, SignupAttribute> = {
    EMAIL: 'email',
    PHONE_NUMBER: 'phone',
    USERNAME: 'username',
  };
  const mapped = signupAttributes.map((attr) => mapping[attr]).filter((a): a is SignupAttribute => a !== undefined);
  return mapped.length > 0 ? mapped : ['email'];
}

interface GeneratedCredentials {
  email?: string;
  phoneNumber?: string;
  username?: string;
  password: string;
}

/**
 * Generates only the credentials required by the resolved auth config.
 * The union of signupAttributes and signinIdentifier determines which
 * identity fields are needed. Password is always generated.
 */
function generateCredentials(resolved: ResolvedAuthConfig): GeneratedCredentials {
  const needed = new Set<SignupAttribute | SigninIdentifier>([...resolved.signupAttributes, resolved.signinIdentifier]);
  return {
    email: needed.has('email') ? generateTestEmail() : undefined,
    phoneNumber: needed.has('phone') ? generateTestPhoneNumber() : undefined,
    username: needed.has('username') ? generateTestUsername() : undefined,
    password: generateTestPassword(),
  };
}

function buildAdminCreateUserInput(
  userPoolId: string,
  resolved: ResolvedAuthConfig,
  credentials: GeneratedCredentials,
): { UserPoolId: string; Username: string; TemporaryPassword: string; UserAttributes: AttributeType[]; MessageAction: 'SUPPRESS' } {
  const { signinIdentifier, signupAttributes } = resolved;

  const identifierValueMap: Record<SigninIdentifier, string | undefined> = {
    email: credentials.email,
    phone: credentials.phoneNumber,
    username: credentials.username,
  };
  const username = identifierValueMap[signinIdentifier] ?? '';

  const attributeMap: Record<SignupAttribute, AttributeType | undefined> = {
    email: credentials.email ? { Name: 'email', Value: credentials.email } : undefined,
    phone: credentials.phoneNumber ? { Name: 'phone_number', Value: credentials.phoneNumber } : undefined,
    username: credentials.username ? { Name: 'username', Value: credentials.username } : undefined,
  };

  // When phone or username is used as the Username, Cognito already
  // associates it with the user, so including it again in UserAttributes
  // would be redundant. Email is the exception — Cognito requires it in
  // UserAttributes for verification even when it's also the Username.
  const userAttributes: AttributeType[] = signupAttributes
    .filter((attr) => {
      if (signinIdentifier === 'phone' && attr === 'phone') return false;
      if (signinIdentifier === 'username' && attr === 'username') return false;
      return true;
    })
    .map((attr) => attributeMap[attr])
    .filter((a): a is AttributeType => a !== undefined);

  // Mark email/phone as verified so the user can sign in immediately
  if (credentials.email) {
    userAttributes.push({ Name: 'email_verified', Value: 'true' });
  }
  if (credentials.phoneNumber) {
    userAttributes.push({ Name: 'phone_number_verified', Value: 'true' });
  }

  return {
    UserPoolId: userPoolId,
    Username: username,
    TemporaryPassword: credentials.password,
    UserAttributes: userAttributes,
    MessageAction: 'SUPPRESS',
  };
}

/**
 * Generates a unique random suffix for test credentials.
 */
function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

function generateTestPhoneNumber(): string {
  // Generate a random 7-digit number for the local part
  const local = Math.floor(1000000 + Math.random() * 9000000);
  return `+1555${local}`;
}

function generateTestUsername(): string {
  return `testuser-${randomSuffix()}`;
}

function generateTestPassword(): string {
  // Meets Cognito default policy: uppercase, lowercase, digit, special, 8+ chars
  return `Test${randomSuffix()}!Aa1`;
}

/**
 * Provisions a test user via AdminCreateUser and sets a permanent password.
 * Uses admin APIs so it works even when self-signup is disabled on the user pool.
 * Generates unique credentials dynamically for each invocation.
 * Does NOT sign in — the caller should handle signIn in its own module scope
 * so the Amplify auth singleton has the tokens available for API/Storage calls.
 * Returns the username to use for signIn.
 */
export async function provisionTestUser(config: AmplifyConfig): Promise<{ signinValue: string; testUser: TestUser }> {
  const { aws_user_pools_id: userPoolId, aws_cognito_region: region } = config;

  const resolved: ResolvedAuthConfig = {
    signinIdentifier: resolveSigninIdentifier(config.aws_cognito_username_attributes ?? []),
    signupAttributes: resolveSignupAttributes(config.aws_cognito_signup_attributes ?? []),
  };

  const credentials = generateCredentials(resolved);

  const createUserInput = buildAdminCreateUserInput(userPoolId ?? '', resolved, credentials);
  const signinValue = createUserInput.Username;

  console.log(`\n🔑 Creating test user: ${createUserInput.Username}`);

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  // Step 1: AdminCreateUser
  try {
    await cognitoClient.send(new AdminCreateUserCommand(createUserInput));
    console.log('✅ AdminCreateUser succeeded');
  } catch (error) {
    console.error('❌ AdminCreateUser failed:', getErrorMessage(error));
    return process.exit(1);
  }

  // Step 2: AdminSetUserPassword (set permanent password, moves user out of FORCE_CHANGE_PASSWORD)
  try {
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: createUserInput.Username,
        Password: credentials.password,
        Permanent: true,
      }),
    );
    console.log('✅ AdminSetUserPassword succeeded');
  } catch (error) {
    console.error('❌ AdminSetUserPassword failed:', getErrorMessage(error));
    return process.exit(1);
  }

  const testUser: TestUser = {
    username: signinValue,
    password: credentials.password,
    ...(credentials.email !== undefined && { email: credentials.email }),
    ...(credentials.phoneNumber !== undefined && { phoneNumber: credentials.phoneNumber }),
  };

  return { signinValue, testUser };
}
