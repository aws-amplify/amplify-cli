import { Logger } from './logger';
import fs from 'fs-extra';
import { refreshCredentials } from '@aws-amplify/amplify-e2e-core';
import { pathManager } from '@aws-amplify/amplify-cli-core';
import * as path from 'path';

/**
 * Owns the AWS credential lifecycle for a single migration run.
 *
 * Always exposes a named profile (`this.profile`) that callers wire into
 * subprocess `AWS_PROFILE` and SDK client configs. Credentials are never
 * returned — the profile is the single source of truth.
 *
 * ## Profile mode (`callerProfile` is set)
 *
 * The caller-supplied profile is already present in `~/.aws/credentials`.
 * `refresh()` is a no-op.
 *
 * ## Role mode (`callerProfile` is undefined, `TEST_ACCOUNT_ROLE` is set)
 *
 * `refresh()` assumes the role from `TEST_ACCOUNT_ROLE` via STS and merges
 * the returned credentials into `~/.aws/credentials` (and region into
 * `~/.aws/config`) under a generated profile name. Any pre-existing
 * profiles in those files are preserved — the managed section is added if
 * absent or replaced in place if already present.
 *
 * `refresh()` is idempotent across repeat calls with the same generated
 * profile name: calling it many times produces the same on-disk state as
 * calling it once. It must be called before each long-running step so
 * session tokens don't expire mid-operation.
 */
export class CredentialManager {
  private readonly callerProfile: string | undefined;
  private readonly roleArn: string | undefined;
  private readonly logger: Logger;
  private readonly generatedProfile: string;

  constructor(callerProfile: string | undefined, region: string, generatedProfile: string, logger: Logger) {
    this.callerProfile = callerProfile;
    this.roleArn = callerProfile ? undefined : process.env.TEST_ACCOUNT_ROLE;
    this.generatedProfile = generatedProfile;
    this.logger = logger;

    this.logger.info(`Using profile: ${this.profile}`);

    if (this.roleArn) {
      // create the initial file contents since the refresh function
      // needs them to exist.
      process.env.AWS_SHARED_CREDENTIALS_FILE = `${pathManager.getAWSCredentialsFilePath()}.${generatedProfile}`;
      process.env.AWS_CONFIG_FILE = `${pathManager.getAWSConfigFilePath()}.${generatedProfile}`;

      touchFileSync(process.env.AWS_SHARED_CREDENTIALS_FILE, '');
      touchFileSync(process.env.AWS_CONFIG_FILE, [`[profile ${generatedProfile}]`, `region=${region}`, ''].join('\n'));

      this.logger.info(`AWS_SHARED_CREDENTIALS_FILE: ${process.env.AWS_SHARED_CREDENTIALS_FILE}`);
      this.logger.info(`AWS_CONFIG_FILE: ${process.env.AWS_CONFIG_FILE}`);
    }
  }

  /**
   * Name of the AWS profile that `amplify init` should use. In profile mode,
   * this is the caller-supplied profile. In role mode, it's the generated
   * profile merged into `~/.aws/credentials` by `refresh()`.
   */
  public get profile(): string {
    return this.callerProfile ?? this.generatedProfile;
  }

  /**
   * Refresh credentials if in role mode by assuming the role and merging
   * the managed profile into the shared credentials and config files.
   * No-op in profile mode — the caller's long-lived profile handles auth.
   *
   * Idempotent: repeated calls with the same generated profile name produce
   * the same on-disk state as a single call.
   */
  public async refresh(): Promise<void> {
    if (!this.roleArn) {
      return;
    }
    this.logger.info(`Refreshing credentials for profile ${this.profile}...`);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    await refreshCredentials(this.roleArn, this.profile);
    this.logger.info(`Credentials for profile ${this.profile} refreshed`);
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

function touchFileSync(fp: string, contents: string): void {
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, contents);
}
