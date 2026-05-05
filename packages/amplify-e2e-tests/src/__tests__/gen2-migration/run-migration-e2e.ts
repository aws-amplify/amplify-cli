/* eslint-disable spellcheck/spell-checker */
import { execSync } from 'child_process';
import { STSClient, GetCallerIdentityCommand, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { OrganizationsClient, ListAccountsCommand } from '@aws-sdk/client-organizations';
import { fromContainerMetadata } from '@aws-sdk/credential-providers';
import { App, Teardown } from '@aws-amplify/amplify-e2e-gen2-migration';

/**
 * Jest timeout for migration tests (2 hours). Migration runs involve
 * full Gen1 push + Gen2 sandbox deploy and can take 30–90 minutes.
 */
export const MIGRATION_TEST_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/**
 * Select a random child account using fresh container credentials.
 *
 * Uses the CodeBuild container role (via IMDS/ECS metadata) to assume
 * TEST_ACCOUNT_ROLE, then lists org accounts and picks one at random.
 * This avoids depending on the shell-level env var credentials which
 * may have expired by the time the test starts.
 */
async function selectChildAccount(): Promise<string> {
  const containerCreds = fromContainerMetadata();
  const sts = new STSClient({ credentials: containerCreds });

  // Assume parent account role
  const parentRole = process.env.TEST_ACCOUNT_ROLE;
  if (!parentRole) {
    throw new Error('TEST_ACCOUNT_ROLE must be set');
  }
  const assumeResult = await sts.send(
    new AssumeRoleCommand({
      RoleArn: parentRole,
      RoleSessionName: `gen2-mig-select-${Date.now()}`,
      DurationSeconds: 900,
    }),
  );
  const parentCreds = assumeResult.Credentials;

  // List child accounts from the parent
  const orgClient = new OrganizationsClient({
    credentials: {
      accessKeyId: parentCreds.AccessKeyId,
      secretAccessKey: parentCreds.SecretAccessKey,
      sessionToken: parentCreds.SessionToken,
    },
  });
  const parentAccountId = (
    await new STSClient({
      credentials: {
        accessKeyId: parentCreds.AccessKeyId,
        secretAccessKey: parentCreds.SecretAccessKey,
        sessionToken: parentCreds.SessionToken,
      },
    }).send(new GetCallerIdentityCommand({}))
  ).Account;

  const { Accounts } = await orgClient.send(new ListAccountsCommand({}));
  const childAccounts = (Accounts ?? []).map((a) => a.Id).filter((id): id is string => !!id && id !== parentAccountId);

  if (childAccounts.length === 0) {
    throw new Error('No child accounts found');
  }

  const picked = childAccounts[Math.floor(Math.random() * childAccounts.length)];
  console.log(`Selected child account: ${picked}`);
  return picked;
}

/**
 * Run the gen2-migration E2E for a single app by calling App.migrate()
 * directly in-process.
 *
 * Sets up the environment so that the App's CredentialManager operates
 * in CI mode (two-hop assume-role from container credentials).
 */
export async function runMigrationE2E(appName: string): Promise<void> {
  // Select a child account using fresh container credentials.
  const childAccountId = await selectChildAccount();
  process.env.CHILD_ACCOUNT_ID = childAccountId;

  // Configure git identity — the migration workflow makes commits.
  execSync('git config --global user.email "amplify-cli-e2e@test.com"', { encoding: 'utf-8' });
  execSync('git config --global user.name "Amplify CLI E2E Test Name"', { encoding: 'utf-8' });

  // Construct App with profile=undefined to trigger CI mode in
  // CredentialManager. The CredentialManager uses fromContainerMetadata()
  // explicitly, so it works even with child account creds in process.env.
  const app = new App(appName, undefined);
  try {
    await app.migrate();
    if (process.env.UPDATE_SNAPSHOTS === '1') {
      app.updateSnapshots();
    }
  } finally {
    await app.refreshCredentials();
    await new Teardown(app.deploymentName, app.profile).clean();
  }
}
