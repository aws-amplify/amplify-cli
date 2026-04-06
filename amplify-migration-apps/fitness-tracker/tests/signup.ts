/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  CognitoIdentityProviderClient,
  AdminCreateUserCommand,
  AdminSetUserPasswordCommand,
  AdminAddUserToGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import * as fs from 'fs';
import { randomBytes } from 'crypto';
import { configureAmplify } from '../src/api-config';

import { webcrypto } from 'crypto';
if (typeof globalThis.crypto === 'undefined') {
  (globalThis as any).crypto = webcrypto;
}

const CONFIG_PATH = process.env.APP_CONFIG_PATH;
if (!CONFIG_PATH) {
  throw new Error('APP_CONFIG_PATH environment variable is required');
}

export const config = JSON.parse(fs.readFileSync(CONFIG_PATH, { encoding: 'utf-8' }));
configureAmplify(config);

export async function signUp(cfg: any): Promise<{ username: string; password: string }> {
  const gen2Auth = (cfg as any)?.auth;
  const userPoolId = cfg.aws_user_pools_id ?? gen2Auth?.user_pool_id;
  const region = cfg.aws_cognito_region ?? gen2Auth?.aws_region;

  const uname = generateTestUsername();
  const pwd = generateTestPassword();

  const cognitoClient = new CognitoIdentityProviderClient({ region });

  await cognitoClient.send(new AdminCreateUserCommand({
    UserPoolId: userPoolId,
    Username: uname,
    TemporaryPassword: pwd,
    UserAttributes: [
      { Name: 'email', Value: generateTestEmail() },
      { Name: 'email_verified', Value: 'true' },
    ],
    MessageAction: 'SUPPRESS',
  }));

  await cognitoClient.send(new AdminSetUserPasswordCommand({
    UserPoolId: userPoolId,
    Username: uname,
    Password: pwd,
    Permanent: true,
  }));

  await cognitoClient.send(new AdminAddUserToGroupCommand({
    UserPoolId: userPoolId,
    Username: uname,
    GroupName: 'Admin',
  }));

  return { username: uname, password: pwd };
}

function generateTestPassword(): string {
  return `Test${randomSuffix()}!Aa1`;
}

function generateTestEmail(): string {
  return `testuser-${randomSuffix()}@amazon.com`;
}

function generateTestUsername(): string {
  return `testuser-${randomSuffix()}`;
}

function randomSuffix(): string {
  return randomBytes(4).toString('hex');
}
