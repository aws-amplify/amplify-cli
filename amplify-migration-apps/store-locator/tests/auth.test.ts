/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
  AdminListGroupsForUserCommand,
  AdminDeleteUserCommand,
  DescribeUserPoolCommand,
  UpdateUserPoolCommand,
  UserPoolType,
  UpdateUserPoolCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import { signUp } from 'aws-amplify/auth';
import { randomBytes } from 'crypto';
import { configureAmplify } from './signup';

const config = configureAmplify();

/**
 * Verifies the PostConfirmation Cognito trigger auto-adds confirmed users
 * to the `storeLocatorAdmin` group. Exercises the gen1 `add-to-group` Lambda
 * after it's been migrated to a gen2 `postConfirmation` trigger.
 *
 * The trigger only fires on the real sign-up + confirm flow, which requires
 * self-service sign-up on the user pool. AWS's internal mitigation service
 * (`CognitoIdpUserPoolDisableSelf`) disables self-sign-up on newly created
 * pools shortly after creation, so we re-enable it for the test and restore
 * the original value afterwards.
 *
 * Cognito's UpdateUserPool API resets any omitted field to its default. To
 * avoid clobbering unrelated settings (Lambda triggers, email templates,
 * etc.), we always `DescribeUserPool` first and submit the full resolved
 * config with just the one field flipped.
 */
describe('PostConfirmation trigger', () => {
  const gen2Auth = config.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  const cognito = new CognitoIdentityProviderClient({ region });
  let originalAllowAdminCreateUserOnly: boolean | undefined;

  async function setAllowAdminCreateUserOnly(desired: boolean): Promise<void> {
    const { UserPool } = await cognito.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    if (!UserPool) throw new Error(`User pool not found: ${userPoolId}`);
    if (UserPool.AdminCreateUserConfig?.AllowAdminCreateUserOnly === desired) return;
    await cognito.send(new UpdateUserPoolCommand(buildUpdateUserPoolInput(userPoolId, UserPool, desired)));
  }

  beforeAll(async () => {
    const { UserPool } = await cognito.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    originalAllowAdminCreateUserOnly = UserPool?.AdminCreateUserConfig?.AllowAdminCreateUserOnly;
    await setAllowAdminCreateUserOnly(false);
  }, 30_000);

  afterAll(async () => {
    if (originalAllowAdminCreateUserOnly === undefined) return;
    await setAllowAdminCreateUserOnly(originalAllowAdminCreateUserOnly).catch(() => undefined);
  }, 30_000);

  it('adds confirmed user to storeLocatorAdmin group', async () => {
    const username = `testuser-${randomBytes(4).toString('hex')}@test.example.com`;
    const password = `Test${randomBytes(4).toString('hex')}!Aa1`;

    try {
      await signUp({
        username,
        password,
        options: { userAttributes: { email: username } },
      });
    } catch (err: any) {
      // Ignore daily email limit errors — we don't need the verification email to actually send.
      const isEmailLimitError = err.name === 'LimitExceededException' && err.message?.includes('Exceeded daily email limit');
      if (!isEmailLimitError) throw err;
    }

    try {
      await cognito.send(new AdminConfirmSignUpCommand({
        UserPoolId: userPoolId,
        Username: username,
      }));

      // PostConfirmation runs asynchronously after confirm.
      const group = await waitForGroup(cognito, userPoolId, username, 'storeLocatorAdmin');
      expect(group).toBeDefined();
    } finally {
      await cognito.send(new AdminDeleteUserCommand({
        UserPoolId: userPoolId,
        Username: username,
      })).catch(() => undefined);
    }
  }, 60_000);
});

/**
 * Builds an UpdateUserPool input from a DescribeUserPool response, overriding
 * AdminCreateUserConfig.AllowAdminCreateUserOnly. Cognito's UpdateUserPool
 * resets any omitted field to its default, so we carry forward every field
 * that's safe to pass through.
 *
 * Fields the API refuses on UpdateUserPool (per AWS docs) are omitted:
 * Arn, CreationDate, CustomDomain, Domain, EmailConfigurationFailure,
 * EstimatedNumberOfUsers, Id, LastModifiedDate, Name, SchemaAttributes,
 * SmsConfigurationFailure, Status, UsernameAttributes, UsernameConfiguration.
 */
function buildUpdateUserPoolInput(
  userPoolId: string,
  pool: UserPoolType,
  allowAdminCreateUserOnly: boolean,
): UpdateUserPoolCommandInput {
  return {
    UserPoolId: userPoolId,
    Policies: pool.Policies,
    DeletionProtection: pool.DeletionProtection,
    LambdaConfig: pool.LambdaConfig,
    AutoVerifiedAttributes: pool.AutoVerifiedAttributes,
    SmsVerificationMessage: pool.SmsVerificationMessage,
    EmailVerificationMessage: pool.EmailVerificationMessage,
    EmailVerificationSubject: pool.EmailVerificationSubject,
    VerificationMessageTemplate: pool.VerificationMessageTemplate,
    SmsAuthenticationMessage: pool.SmsAuthenticationMessage,
    UserAttributeUpdateSettings: pool.UserAttributeUpdateSettings,
    MfaConfiguration: pool.MfaConfiguration,
    DeviceConfiguration: pool.DeviceConfiguration,
    EmailConfiguration: pool.EmailConfiguration,
    SmsConfiguration: pool.SmsConfiguration,
    UserPoolTags: pool.UserPoolTags,
    AdminCreateUserConfig: {
      ...pool.AdminCreateUserConfig,
      AllowAdminCreateUserOnly: allowAdminCreateUserOnly,
    },
    UserPoolAddOns: pool.UserPoolAddOns,
    AccountRecoverySetting: pool.AccountRecoverySetting,
    PoolName: pool.Name,
    UserPoolTier: pool.UserPoolTier,
  };
}

async function waitForGroup(
  cognito: CognitoIdentityProviderClient,
  userPoolId: string,
  username: string,
  groupName: string,
): Promise<string> {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const result = await cognito.send(new AdminListGroupsForUserCommand({
      UserPoolId: userPoolId,
      Username: username,
    }));
    const match = (result.Groups ?? []).find((g) => g.GroupName === groupName);
    if (match) return match.GroupName!;
    await new Promise((r) => setTimeout(r, 1_000));
  }
  throw new Error(`User '${username}' was not added to group '${groupName}' within 30s`);
}
