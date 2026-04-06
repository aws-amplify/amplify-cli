#!/usr/bin/env npx ts-node
/**
 * Pre-sandbox script for media-vault app.
 *
 * Writes the social provider secrets to SSM Parameter Store before the
 * first sandbox deploy. Auth secrets must exist at deploy time because
 * CDK resolves them during synthesis.
 *
 * The SSM path convention is:
 *   /amplify/<app-name>/<app-name>-<whoami>-sandbox/<secret-name>
 */

import { SSMClient, PutParameterCommand } from '@aws-sdk/client-ssm';
import fs from 'fs';
import os from 'os';
import path from 'path';

const SECRETS: Record<string, string> = {
  FACEBOOK_CLIENT_ID: 'dummy-facebook-client-id',
  FACEBOOK_CLIENT_SECRET: 'dummy-facebook-client-secret',
  GOOGLE_CLIENT_ID: 'dummy-google-client-id',
  GOOGLE_CLIENT_SECRET: 'dummy-google-client-secret',
};

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);

  const packageJsonPath = path.join(appPath, 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  const appName = packageJson.name as string;

  const username = os.userInfo().username;
  const ssmSegment = `${appName}-${username}-sandbox`;

  const ssm = new SSMClient({});
  for (const [secretName, secretValue] of Object.entries(SECRETS)) {
    await ssm.send(new PutParameterCommand({
      Name: `/amplify/${appName}/${ssmSegment}/${secretName}`,
      Value: secretValue,
      Type: 'SecureString',
      Overwrite: true,
    }));
  }
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
