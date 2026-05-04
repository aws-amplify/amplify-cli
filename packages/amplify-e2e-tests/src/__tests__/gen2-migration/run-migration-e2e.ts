/* eslint-disable spellcheck/spell-checker */
import { execSync } from 'child_process';
import { STSClient, GetCallerIdentityCommand } from '@aws-sdk/client-sts';
import { App, Teardown } from '@aws-amplify/amplify-e2e-gen2-migration';

/**
 * Jest timeout for migration tests (2 hours). Migration runs involve
 * full Gen1 push + Gen2 sandbox deploy and can take 30–90 minutes.
 */
export const MIGRATION_TEST_TIMEOUT_MS = 2 * 60 * 60 * 1000;

/**
 * Resolve the child account ID from the current STS caller identity.
 *
 * The `retry` wrapper in shared-scripts.sh has already assumed into a
 * random child account via `setAwsAccountCredentials` before Jest
 * starts, so the current credentials point to the child account.
 */
async function resolveChildAccountId(): Promise<string> {
  const sts = new STSClient({});
  const response = await sts.send(new GetCallerIdentityCommand({}));
  return response.Account;
}

/**
 * Run the gen2-migration E2E for a single app by calling App.migrate()
 * directly in-process.
 *
 * Sets up the environment so that the App's CredentialManager operates
 * in CI mode (two-hop assume-role from container credentials).
 */
export async function runMigrationE2E(appName: string): Promise<void> {
  // Resolve the child account ID from the shell-level credentials.
  const childAccountId = await resolveChildAccountId();
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
