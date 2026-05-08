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
 * The shell-level `setAwsAccountCredentials` has already assumed into a
 * child account and set AWS_ACCESS_KEY_ID/SECRET/TOKEN in the env.
 * `configure_tests.ts` wrote those same credentials to the
 * `amplify-integ-test-user` profile that `amplify init`/`push` use.
 *
 * We must use the SAME account for the Gen2 sandbox, so we read the
 * account ID from the current env var credentials rather than picking
 * a random one.
 */
async function resolveChildAccountId(): Promise<string> {
  const sts = new STSClient({});
  const response = await sts.send(new GetCallerIdentityCommand({}));
  const accountId = response.Account;
  console.log(`Selected child account: ${accountId}`);
  return accountId;
}

/**
 * Run the gen2-migration E2E for a single app by calling App.migrate()
 * directly in-process.
 *
 * Sets up the environment so that the App's CredentialManager operates
 * in CI mode (two-hop assume-role from container credentials).
 */
export async function runMigrationE2E(appName: string): Promise<void> {
  // Resolve the child account from the shell-level credentials.
  // This must be the same account that amplify init/push deploy to.
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
    app.logger.info(`Execution completed successfully (${app.targetAppPath})`);
  } catch (error) {
    console.log();
    (error as Error).message = `Execution failed: ${(error as Error).message}\n\n(App path: ${app.targetAppPath})\n`;
    console.log((error as Error).stack);
    console.log();
    throw error;
  } finally {
    const creds = await app.refreshCredentials();
    if (creds) {

    }
    const teardown = new Teardown(app.deploymentName, creds ? { credentials: creds } : app.getClientConfig());
    await teardown.clean();
  }
}
