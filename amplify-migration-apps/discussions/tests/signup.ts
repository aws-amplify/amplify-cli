/* eslint-disable @typescript-eslint/no-explicit-any */
import { Amplify } from 'aws-amplify';
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

export function configureAmplify(cfg?: any): any {
  if (!cfg) {
    const configPath = process.env.APP_CONFIG_PATH;
    if (!configPath) {
      throw new Error('APP_CONFIG_PATH environment variable is required');
    }
    cfg = JSON.parse(fs.readFileSync(configPath, { encoding: 'utf-8' }));
  }
  Amplify.configure(cfg);
  return cfg;
}

export async function signUp(cfg: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (cfg as any)?.auth;
  const userPoolId = cfg.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = cfg.aws_cognito_region ?? gen2Auth?.aws_region;

  const uname = generateTestPhoneNumber();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(
    new AdminCreateUserCommand({
      UserPoolId: userPoolId,
      Username: uname,
      TemporaryPassword: pwd,
      UserAttributes: [
        { Name: 'email', Value: generateTestEmail() },
        { Name: 'email_verified', Value: 'true' },
        { Name: 'phone_number', Value: uname },
        { Name: 'phone_number_verified', Value: 'true' },
      ],
      MessageAction: 'SUPPRESS',
    }),
  );

  await cognitoClient.send(
    new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: uname,
      Password: pwd,
      Permanent: true,
    }),
  );

  return { username: uname, password: pwd };
}

export function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

export function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@test.example.com`;
}

export function generateTestPhoneNumber(): string {
  const local = Math.floor(1000000 + Math.random() * 9000000);
  return `+1555${local}`;
}

export function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
