#!/usr/bin/env npx ts-node
/**
 * Pre-push script for media-vault app.
 *
 * Writes dummy Facebook/Google OAuth credentials into the deployment
 * secrets file (~/.aws/amplify/deployment-secrets.json) so that
 * `amplify push` can configure the Cognito social identity providers.
 * The credentials don't need to be real — Cognito accepts any string
 * values during deployment. Real OAuth flows won't work, but the
 * e2e tests use AdminCreateUser and don't exercise social login.
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

function readMeta(appPath: string): { rootStackId: string; envName: string } {
  const tpiPath = path.join(appPath, 'amplify', 'team-provider-info.json');
  const tpi = JSON.parse(fs.readFileSync(tpiPath, 'utf-8'));
  const envName = Object.keys(tpi)[0];
  const stackIdArn = tpi[envName].awscloudformation?.StackId as string;
  const rootStackId = stackIdArn.split('/').pop()!;
  return { rootStackId, envName };
}

// See: packages/amplify-cli-core/src/deploymentSecretsHelper.ts
function writeDeploymentSecrets(rootStackId: string, envName: string): void {
  const secretsDir = path.join(os.homedir(), '.aws', 'amplify');
  const secretsPath = path.join(secretsDir, 'deployment-secrets.json');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let secrets: any = { appSecrets: [] };
  if (fs.existsSync(secretsPath)) {
    secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf-8'));
  }

  const creds = JSON.stringify([
    { ProviderName: 'Facebook', client_id: 'dummy-facebook-id', client_secret: 'dummy-facebook-secret' },
    { ProviderName: 'Google', client_id: 'dummy-google-id', client_secret: 'dummy-google-secret' },
  ]);

  secrets.appSecrets.push({
    rootStackId,
    environments: {
      [envName]: {
        auth: {
          mediavault1f08412d: { hostedUIProviderCreds: creds },
        },
      },
    },
  });

  fs.mkdirSync(secretsDir, { recursive: true });
  fs.writeFileSync(secretsPath, JSON.stringify(secrets, null, 2), 'utf-8');
}

async function main(): Promise<void> {
  const [appPath = process.cwd()] = process.argv.slice(2);
  const { rootStackId, envName } = readMeta(appPath);
  writeDeploymentSecrets(rootStackId, envName);
}

main().catch((error) => {
  console.error('Fatal error:', error.message);
  process.exit(1);
});
