/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
  AdminListGroupsForUserCommand,
  AdminDeleteUserCommand,
  DescribeUserPoolCommand,
  UpdateUserPoolCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { signUp } from 'aws-amplify/auth';
import { randomBytes } from 'crypto';
import { config } from './signup';

/**
 * Verifies the PostConfirmation Cognito trigger auto-adds confirmed users
 * to the `storeLocatorAdmin` group. Exercises the gen1 `add-to-group` Lambda
 * after it's been migrated to a gen2 `postConfirmation` trigger.
 *
 * The trigger only fires on the real sign-up + confirm flow, which requires
 * self-service sign-up on the user pool. We toggle it on for the test and
 * restore the original value afterwards.
 */
describe('PostConfirmation trigger', () => {
  const gen2Auth = (config as any)?.auth;
  const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

  const cognito = new CognitoIdentityProviderClient({ region });
  let originalAllowAdminCreateUserOnly: boolean | undefined;

  beforeAll(async () => {
    const described = await cognito.send(new DescribeUserPoolCommand({ UserPoolId: userPoolId }));
    originalAllowAdminCreateUserOnly = described.UserPool?.AdminCreateUserConfig?.AllowAdminCreateUserOnly;
    if (originalAllowAdminCreateUserOnly !== false) {
      await cognito.send(new UpdateUserPoolCommand({
        UserPoolId: userPoolId,
        AdminCreateUserConfig: { AllowAdminCreateUserOnly: false },
      }));
    }
  }, 30_000);

  afterAll(async () => {
    if (originalAllowAdminCreateUserOnly === undefined) return;
    await cognito.send(new UpdateUserPoolCommand({
      UserPoolId: userPoolId,
      AdminCreateUserConfig: { AllowAdminCreateUserOnly: originalAllowAdminCreateUserOnly },
    })).catch(() => undefined);
  }, 30_000);

  it('adds confirmed user to storeLocatorAdmin group', async () => {
    const username = `testuser-${randomBytes(4).toString('hex')}@test.example.com`;
    const password = `Test${randomBytes(4).toString('hex')}!Aa1`;

    await signUp({
      username,
      password,
      options: { userAttributes: { email: username } },
    });

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
