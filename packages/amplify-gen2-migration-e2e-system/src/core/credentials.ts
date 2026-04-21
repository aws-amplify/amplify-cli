import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { Logger } from './logger';

/**
 * AWS credential key-value pairs suitable for passing to subprocess `env`
 * options or constructing SDK clients.
 */
export interface AwsCredentials {
  readonly AWS_ACCESS_KEY_ID: string;
  readonly AWS_SECRET_ACCESS_KEY: string;
  readonly AWS_SESSION_TOKEN: string;
}

/**
 * Duration for assumed-role sessions. One hour strikes a balance between
 * STS call cost and headroom for any single step (all steps are well under
 * an hour individually).
 */
const SESSION_DURATION_SECONDS = 3600;

/**
 * Owns the AWS credential lifecycle for a single migration run.
 *
 * ## Profile mode (`callerProfile` is set)
 *
 * The caller-supplied profile is already present in `~/.aws/credentials`.
 * `refresh()` returns `undefined` — no env override needed.
 *
 * ## Role mode (`callerProfile` is undefined, `TEST_ACCOUNT_ROLE` is set)
 *
 * `refresh()` assumes the role from `TEST_ACCOUNT_ROLE` via STS and returns
 * fresh credentials as an `AwsCredentials` object. The caller is responsible
 * for passing these to subprocesses (via `env`) and SDK clients. This class
 * does not modify `process.env`.
 *
 * Additionally, the credentials are written to `~/.aws/credentials` under a
 * generated profile name because `amplify init` reads the shared INI file
 * directly. `this.profile` exposes that name for `init()` to pass.
 *
 * `refresh()` must be called before each long-running step so session tokens
 * don't expire mid-operation.
 */
export class CredentialManager {
  private readonly callerProfile: string | undefined;
  private readonly roleArn: string | undefined;
  private readonly region: string;
  private readonly logger: Logger;
  private readonly generatedProfile: string;

  constructor(callerProfile: string | undefined, region: string, generatedProfile: string, logger: Logger) {
    this.callerProfile = callerProfile;
    this.roleArn = callerProfile ? undefined : process.env.TEST_ACCOUNT_ROLE;
    this.region = region;
    this.generatedProfile = generatedProfile;
    this.logger = logger;
  }

  /** Whether this manager operates in role mode (CI). */
  private get isRoleMode(): boolean {
    return this.roleArn !== undefined;
  }

  /**
   * Name of the AWS profile that `amplify init` should use. In profile mode,
   * this is the caller-supplied profile. In role mode, it's the generated
   * profile written to `~/.aws/credentials` by `refresh()`.
   */
  public get profile(): string {
    return this.callerProfile ?? this.generatedProfile;
  }

  /**
   * Refresh credentials if in role mode. Returns fresh credentials to be
   * passed to sub-processes and SDK clients. In profile mode returns
   * `undefined` — the caller's long-lived profile handles auth.
   */
  public async refresh(): Promise<AwsCredentials | undefined> {
    if (!this.isRoleMode) {
      return undefined;
    }
    this.logger.info('Refreshing credentials...');
    const sts = new STSClient({});
    const assumed = await sts.send(
      new AssumeRoleCommand({
        RoleArn: this.roleArn,
        RoleSessionName: `gen2-migration-e2e-${Date.now()}`,
        DurationSeconds: SESSION_DURATION_SECONDS,
      }),
    );
    const creds = assumed.Credentials;
    if (!creds?.AccessKeyId || !creds?.SecretAccessKey || !creds?.SessionToken) {
      throw new Error('STS AssumeRole returned incomplete credentials');
    }

    const result: AwsCredentials = {
      AWS_ACCESS_KEY_ID: creds.AccessKeyId,
      AWS_SECRET_ACCESS_KEY: creds.SecretAccessKey,
      AWS_SESSION_TOKEN: creds.SessionToken,
    };

    // Write credentials file for `amplify init --profile`.
    this.writeCredentialsFile(creds.AccessKeyId, creds.SecretAccessKey, creds.SessionToken);

    this.logger.info('Credentials refreshed');
    return result;
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
 * Resolve the AWS profile from CLI flags and environment.
 *
 * Rules:
 *   1. `--profile` + `TEST_ACCOUNT_ROLE` → error (conflicting credential sources)
 *   2. `--profile` without `TEST_ACCOUNT_ROLE` → profile mode (local dev)
 *   3. No `--profile` + `TEST_ACCOUNT_ROLE` → role mode (CI)
 *   4. Neither → error
 */
export function resolveProfile(profile: string | undefined): string | undefined {
  const hasTestAccountRole = !!process.env.TEST_ACCOUNT_ROLE;
  if (profile && hasTestAccountRole) {
    throw new Error('--profile cannot be used when TEST_ACCOUNT_ROLE is set');
  }
  if (profile) {
    return profile;
  }
  if (hasTestAccountRole) {
    return undefined;
  }
  throw new Error('Either --profile or the TEST_ACCOUNT_ROLE env var must be set');
}
