/* eslint-disable @typescript-eslint/no-explicit-any */
import { CognitoIdentityProviderClient, AdminCreateUserCommand } from '@aws-sdk/client-cognito-identity-provider';
import { randomBytes } from 'crypto';
import { configureAmplify } from './signup';

describe('PreSignUp trigger', () => {
  it('allows user creation with an amazon.com email', async () => {
    const config = configureAmplify();
    const gen2Auth = (config as any)?.auth;
    const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
    const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

    const cognitoClient = new CognitoIdentityProviderClient({ region });

    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: `testuser-${randomBytes(4).toString('hex')}`,
        TemporaryPassword: `Test${randomBytes(4).toString('hex')}!Aa1`,
        UserAttributes: [
          { Name: 'email', Value: `allowed-${randomBytes(4).toString('hex')}@amazon.com` },
          { Name: 'email_verified', Value: 'true' },
        ],
        MessageAction: 'SUPPRESS',
      }),
    );
  });

  it('rejects user creation with a non-amazon.com email', async () => {
    const config = configureAmplify();
    const gen2Auth = (config as any)?.auth;
    const userPoolId = config.aws_user_pools_id ?? gen2Auth?.user_pool_id;
    const region = config.aws_cognito_region ?? gen2Auth?.aws_region;

    const cognitoClient = new CognitoIdentityProviderClient({ region });

    await expect(
      cognitoClient.send(
        new AdminCreateUserCommand({
          UserPoolId: userPoolId,
          Username: `testuser-${randomBytes(4).toString('hex')}`,
          TemporaryPassword: `Test${randomBytes(4).toString('hex')}!Aa1`,
          UserAttributes: [
            { Name: 'email', Value: `rejected-${randomBytes(4).toString('hex')}@notallowed.com` },
            { Name: 'email_verified', Value: 'true' },
          ],
          MessageAction: 'SUPPRESS',
        }),
      ),
    ).rejects.toBeDefined();
  });
});
