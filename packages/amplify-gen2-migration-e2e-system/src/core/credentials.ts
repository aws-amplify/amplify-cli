import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { Logger } from './logger';

/**
 * Credential source selected by the CLI. Either a named AWS profile (local dev)
 * or a role ARN that must be re-assumed for each long-running step (CI).
 */
export type CredentialSource = { readonly kind: 'profile'; readonly profile: string } | { readonly kind: 'role'; readonly roleArn: string };

/**
 * Duration for assumed-role sessions. One hour strikes a balance between
 * STS call cost and headroom for any single step (all steps are well under
 * an hour individually).
 */
const SESSION_DURATION_SECONDS = 3600;

/**
 * Owns the AWS credential lifecycle for a single migration run.
 *
 * ## Profile mode
 *
 * The caller-supplied profile is already present in `~/.aws/credentials` and
 * `AWS_PROFILE` is set by the caller. Nothing to refresh — the profile is
 * assumed to be long-lived.
 *
 * ## Role mode
 *
 * `refresh()` re-assumes the given role via STS and propagates the fresh
 * credentials through two channels:
 *
 *   1. **Environment variables** (`AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`,
 *      `AWS_SESSION_TOKEN`) — the primary auth source. The AWS SDK default
 *      provider chain reads these before anything else, and spawned
 *      subprocesses (Amplify CLI, `ampx sandbox`) inherit them automatically.
 *      `AWS_PROFILE` is explicitly cleared so it can't override.
 *
 *   2. **`~/.aws/credentials` file** under a generated profile name —
 *      required only because `amplify init` takes a `--profile` flag and
 *      reads the shared INI file directly (bypassing the SDK chain).
 *      `this.profile` exposes that generated name for `init()` to pass.
 *
 * Because env vars are the primary channel, in-process SDK clients don't
 * need explicit `credentials` wiring — they pick up the refreshed values
 * from the default provider chain.
 *
 * `refresh()` must be called before each long-running step so session tokens
 * don't expire mid-operation.
 */
export class CredentialManager {
  private readonly source: CredentialSource;
  private readonly region: string;
  private readonly logger: Logger;
  private readonly generatedProfile: string;

  constructor(source: CredentialSource, region: string, generatedProfile: string, logger: Logger) {
    this.source = source;
    this.region = region;
    this.generatedProfile = generatedProfile;
    this.logger = logger;
  }

  /**
   * Name of the AWS profile that `amplify init` should use. In profile mode,
   * this is the caller-supplied profile. In role mode, it's the generated
   * profile written to `~/.aws/credentials` by `refresh()`.
   */
  public get profile(): string {
    return this.source.kind === 'profile' ? this.source.profile : this.generatedProfile;
  }

  /**
   * Refresh credentials if in role mode. In profile mode this is a no-op —
   * the caller's long-lived profile is assumed to already be valid.
   */
  public async refresh(): Promise<void> {
    if (this.source.kind !== 'role') {
      return;
    }
    try {
      this.logger.info('Refreshing credentials...');
      const sts = new STSClient({});
      const assumed = await sts.send(
        new AssumeRoleCommand({
          RoleArn: this.source.roleArn,
          RoleSessionName: `gen2-migration-e2e-${Date.now()}`,
          DurationSeconds: SESSION_DURATION_SECONDS,
        }),
      );
      const creds = assumed.Credentials;
      if (!creds?.AccessKeyId || !creds?.SecretAccessKey || !creds?.SessionToken) {
        throw new Error('STS AssumeRole returned incomplete credentials');
      }

      // Primary: env vars. Picked up by SDK default chain and inherited by
      // subprocesses. Clear AWS_PROFILE so a stale profile can't shadow them.
      process.env.AWS_ACCESS_KEY_ID = creds.AccessKeyId;
      process.env.AWS_SECRET_ACCESS_KEY = creds.SecretAccessKey;
      process.env.AWS_SESSION_TOKEN = creds.SessionToken;
      delete process.env.AWS_PROFILE;

      // Satellite: named profile file, required by `amplify init --profile`.
      this.writeCredentialsFile(creds.AccessKeyId, creds.SecretAccessKey, creds.SessionToken);

      this.logger.info('Credentials refreshed');
    } catch (e) {
      this.logger.info(`Credential refresh failed: ${(e as Error).message} (continuing with existing credentials)`);
    }
  }

  private writeCredentialsFile(accessKeyId: string, secretAccessKey: string, sessionToken: string): void {
    const awsDir = path.join(os.homedir(), '.aws');
    fs.mkdirSync(awsDir, { recursive: true });

    const credsFile = path.join(awsDir, 'credentials');
    const credsContent =
      `[${this.generatedProfile}]\n` +
      `aws_access_key_id = ${accessKeyId}\n` +
      `aws_secret_access_key = ${secretAccessKey}\n` +
      `aws_session_token = ${sessionToken}\n`;
    fs.writeFileSync(credsFile, credsContent, 'utf-8');

    const configFile = path.join(awsDir, 'config');
    const configContent = `[profile ${this.generatedProfile}]\nregion = ${this.region}\noutput = json\n`;
    fs.writeFileSync(configFile, configContent, 'utf-8');
  }
}

/**
 * Resolve the credential source from CLI flags and environment variables.
 *
 * Resolution order (first match wins):
 *   1. `--profile` and `--roleArn` both set → error, exactly one allowed
 *   2. `--roleArn` flag → role mode
 *   3. `--profile` flag → profile mode
 *   4. `TEST_ACCOUNT_ROLE` env var → role mode (CI context)
 *   5. Otherwise → error
 *
 * `AWS_PROFILE` is not a fallback — defaulting from it may lead to surprising
 * behavior. Operators must pass `--profile` explicitly.
 */
export function resolveCredentialSource(flags: { readonly profile?: string; readonly roleArn?: string }): CredentialSource {
  if (flags.profile && flags.roleArn) {
    throw new Error('--profile and --roleArn are mutually exclusive; specify exactly one');
  }
  if (flags.roleArn) {
    return { kind: 'role', roleArn: flags.roleArn };
  }
  if (flags.profile) {
    return { kind: 'profile', profile: flags.profile };
  }
  const envRoleArn = process.env.TEST_ACCOUNT_ROLE;
  if (envRoleArn) {
    return { kind: 'role', roleArn: envRoleArn };
  }
  throw new Error('One of --profile, --roleArn, or the TEST_ACCOUNT_ROLE env var must be set');
}
