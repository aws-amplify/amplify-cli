import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { fromContainerMetadata } from '@aws-sdk/credential-providers';
import { Logger } from './logger';
import { mergeManagedSection } from './ini-merge';
import type { AwsCredentialIdentity } from '@aws-sdk/types';

/** Duration for assumed-role sessions (1 hour — STS maximum for chained roles). */
const SESSION_DURATION_SECONDS = 3600;

/** Role name used by AWS Organizations for cross-account access. */
const CHILD_ACCOUNT_ROLE_NAME = 'OrganizationAccountAccessRole';

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
 * ## CI mode (`callerProfile` is undefined)
 *
 * Requires `TEST_ACCOUNT_ROLE` (parent-account role ARN) and
 * `CHILD_ACCOUNT_ID` (target child-account ID) in the environment.
 *
 * `refresh()` performs a two-hop assume-role chain:
 *
 *   CodeBuild container creds (long-lived)
 *     → assume `TEST_ACCOUNT_ROLE` (parent account, 1hr session)
 *       → assume `OrganizationAccountAccessRole` in `CHILD_ACCOUNT_ID` (1hr session)
 *
 * The final child-account credentials are written into
 * `~/.aws/credentials` under a generated profile name. Because each
 * `refresh()` call re-assumes both roles from the CodeBuild base
 * credentials, sessions never expire mid-migration — callers just need
 * to call `refresh()` before each long-running step.
 */
export class CredentialManager {
  private readonly callerProfile: string | undefined;
  private readonly parentRoleArn: string | undefined;
  private readonly childAccountId: string | undefined;
  private readonly region: string;
  private readonly logger: Logger;
  private readonly generatedProfile: string;

  constructor(callerProfile: string | undefined, region: string, generatedProfile: string, logger: Logger) {
    this.callerProfile = callerProfile;
    this.parentRoleArn = callerProfile ? undefined : process.env.TEST_ACCOUNT_ROLE;
    this.childAccountId = callerProfile ? undefined : process.env.CHILD_ACCOUNT_ID;
    this.region = region;
    this.generatedProfile = generatedProfile;
    this.logger = logger;
  }

  /** Whether this manager operates in CI mode. */
  public get isCIMode(): boolean {
    return this.callerProfile === undefined;
  }

  /**
   * Name of the AWS profile that subprocesses should use. In profile mode,
   * this is the caller-supplied profile. In CI mode, it's the generated
   * profile merged into `~/.aws/credentials` by `refresh()`.
   */
  public get profile(): string {
    return this.callerProfile ?? this.generatedProfile;
  }

  /**
   * Refresh credentials via the two-hop assume-role chain and write the
   * result into the named profile. No-op in profile mode.
   *
   * Each call starts from the CodeBuild container credentials (resolved
   * via the default provider chain with env vars cleared), so the
   * resulting sessions are always fresh regardless of how long the
   * migration has been running.
   */
  public async refresh(): Promise<AwsCredentialIdentity | undefined> {
    if (!this.isCIMode) {
      return undefined;
    }
    if (!this.parentRoleArn) {
      throw new Error('TEST_ACCOUNT_ROLE must be set in CI mode');
    }
    if (!this.childAccountId) {
      throw new Error('CHILD_ACCOUNT_ID must be set in CI mode');
    }

    this.logger.info('Refreshing credentials (two-hop assume-role)...');

    // Hop 1: CodeBuild container creds → parent account
    // Explicitly use container metadata credentials so that any
    // AWS_ACCESS_KEY_ID/SECRET/TOKEN env vars (e.g. child account
    // creds set by the E2E shell wrapper) are bypassed.
    const parentSts = new STSClient({
      region: this.region,
      credentials: fromContainerMetadata(),
    });
    const parentResult = await parentSts.send(
      new AssumeRoleCommand({
        RoleArn: this.parentRoleArn,
        RoleSessionName: `gen2-mig-parent-${Date.now()}`,
        DurationSeconds: SESSION_DURATION_SECONDS,
      }),
    );
    const parentCreds = parentResult.Credentials;

    if (!parentCreds?.AccessKeyId || !parentCreds?.SecretAccessKey || !parentCreds?.SessionToken) {
      throw new Error('Failed to assume TEST_ACCOUNT_ROLE — STS returned incomplete credentials');
    }
    this.logger.info('Hop 1 complete: assumed parent account role');

    // Hop 2: parent account creds → child account
    const childSts = new STSClient({
      credentials: {
        accessKeyId: parentCreds.AccessKeyId,
        secretAccessKey: parentCreds.SecretAccessKey,
        sessionToken: parentCreds.SessionToken,
      },
      region: this.region,
    });
    const childRoleArn = `arn:aws:iam::${this.childAccountId}:role/${CHILD_ACCOUNT_ROLE_NAME}`;
    const childResult = await childSts.send(
      new AssumeRoleCommand({
        RoleArn: childRoleArn,
        RoleSessionName: `gen2-mig-child-${Date.now()}`,
        DurationSeconds: SESSION_DURATION_SECONDS,
      }),
    );
    const childCreds = childResult.Credentials;
    if (!childCreds?.AccessKeyId || !childCreds?.SecretAccessKey || !childCreds?.SessionToken) {
      throw new Error(`Failed to assume child account role in ${this.childAccountId} — STS returned incomplete credentials`);
    }
    this.logger.info(`Hop 2 complete: assumed child account role in ${this.childAccountId}`);

    this.writeCredentialsFile(childCreds.AccessKeyId, childCreds.SecretAccessKey, childCreds.SessionToken);
    this.logger.info('Credentials refreshed');

    return { accessKeyId: childCreds.AccessKeyId, secretAccessKey: childCreds.SecretAccessKey, sessionToken: childCreds.SessionToken };
  }

  private writeCredentialsFile(accessKeyId: string, secretAccessKey: string, sessionToken: string): void {
    const awsDir = path.join(os.homedir(), '.aws');
    fs.mkdirSync(awsDir, { recursive: true });

    const credsFile = path.join(awsDir, 'credentials');
    const configFile = path.join(awsDir, 'config');

    const credsMerge = prepareMerge(credsFile, this.generatedProfile, {
      aws_access_key_id: accessKeyId,
      aws_secret_access_key: secretAccessKey,
      aws_session_token: sessionToken,
    });
    const configMerge = prepareMerge(configFile, `profile ${this.generatedProfile}`, {
      region: this.region,
      output: 'json',
    });

    atomicWriteFile(credsFile, credsMerge.content, credsMerge.mode);
    atomicWriteFile(configFile, configMerge.content, configMerge.mode);
  }
}

/**
 * Read the target file (if present), merge the managed section into its
 * contents, and compute the mode to write with. A missing file yields
 * empty existing bytes and the default mode `0o600`; existing files
 * preserve their current POSIX mode so writes never widen (or tighten)
 * what the caller chose.
 */
function prepareMerge(filePath: string, header: string, values: Record<string, string>): { content: string; mode: number } {
  const { existing, existingMode } = readExistingFile(filePath);
  const content = mergeManagedSection(existing, header, values);
  const mode = existingMode ?? 0o600;
  return { content, mode };
}

/**
 * Read an existing INI file's bytes and POSIX mode, or return empty bytes
 * and no mode if the file does not exist. Wraps read failures as
 * `Failed to read <path>: <cause>` preserving the underlying error as
 * `{ cause }`.
 */
function readExistingFile(filePath: string): { existing: string; existingMode: number | undefined } {
  if (!fs.existsSync(filePath)) {
    return { existing: '', existingMode: undefined };
  }
  try {
    const existing = fs.readFileSync(filePath, 'utf-8');
    // eslint-disable-next-line no-bitwise
    const existingMode = fs.statSync(filePath).mode & 0o777;
    return { existing, existingMode };
  } catch (cause: unknown) {
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Failed to read ${filePath}: ${message}`, { cause });
  }
}

/**
 * Write `content` to `filePath` atomically by writing to a unique temp
 * file in the same directory and renaming into place. The rename is
 * atomic on POSIX same-filesystem, so a failure at any step leaves the
 * original `filePath` bytes untouched. On failure the temp file is
 * best-effort removed and the error is rethrown as
 * `Failed to write <path>: <cause>` with the underlying error as `{ cause }`.
 *
 * The `mode` argument is applied to the temp file on creation via
 * `writeFileSync`'s `mode` option; the subsequent rename preserves those
 * bits on the target inode.
 */
function atomicWriteFile(filePath: string, content: string, mode: number): void {
  const tmp = `${filePath}.${process.pid}.${crypto.randomBytes(8).toString('hex')}.tmp`;
  try {
    fs.writeFileSync(tmp, content, { encoding: 'utf-8', mode });
    fs.renameSync(tmp, filePath);
  } catch (cause: unknown) {
    // Best-effort temp-file cleanup: skip if the write failed before the
    // temp file was created, or if something else already removed it.
    if (fs.existsSync(tmp)) {
      fs.unlinkSync(tmp);
    }
    const message = cause instanceof Error ? cause.message : String(cause);
    throw new Error(`Failed to write ${filePath}: ${message}`, { cause });
  }
}

/**
 * Resolve the AWS profile from CLI flags and environment.
 *
 * Rules:
 *   1. `--profile` + CI env vars → error (conflicting credential sources)
 *   2. `--profile` alone → profile mode (local dev)
 *   3. `TEST_ACCOUNT_ROLE` + `CHILD_ACCOUNT_ID` → CI mode
 *   4. Neither → error
 */
export function resolveProfile(profile: string | undefined): string | undefined {
  const hasCICredentials = !!process.env.TEST_ACCOUNT_ROLE && !!process.env.CHILD_ACCOUNT_ID;
  if (profile && hasCICredentials) {
    throw new Error('--profile cannot be used when TEST_ACCOUNT_ROLE and CHILD_ACCOUNT_ID are set');
  }
  if (profile) {
    return profile;
  }
  if (hasCICredentials) {
    return undefined;
  }
  if (process.env.TEST_ACCOUNT_ROLE && !process.env.CHILD_ACCOUNT_ID) {
    throw new Error('CHILD_ACCOUNT_ID must be set when TEST_ACCOUNT_ROLE is set');
  }
  throw new Error('Either --profile or TEST_ACCOUNT_ROLE + CHILD_ACCOUNT_ID env vars must be set');
}
