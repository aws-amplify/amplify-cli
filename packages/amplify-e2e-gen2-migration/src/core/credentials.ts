import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { STSClient, AssumeRoleCommand } from '@aws-sdk/client-sts';
import { Logger } from './logger';
import { mergeManagedSection } from './ini-merge';

/**
 * Duration for assumed-role sessions. One hour strikes a balance between
 * STS call cost and headroom for any single step (all steps are well under
 * an hour individually).
 */
const SESSION_DURATION_SECONDS = 3600;

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
    if (!this.isRoleMode) {
      return;
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

    this.writeCredentialsFile(creds.AccessKeyId, creds.SecretAccessKey, creds.SessionToken);

    this.logger.info('Credentials refreshed');
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
