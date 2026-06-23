import {
  CodeBuildClient,
  StartBuildCommand,
  BatchGetBuildsCommand,
  BatchGetProjectsCommand,
  EnvironmentVariable,
} from '@aws-sdk/client-codebuild';
import { fromIni } from '@aws-sdk/credential-providers';
import * as fs from 'fs-extra';
import { join, isAbsolute } from 'path';
import * as yaml from 'js-yaml';
import { AWS_REGIONS_TO_RUN_TESTS, REPO_ROOT } from './cci-utils';

/**
 * Standalone per-shard e2e launcher.
 *
 * Runs each e2e shard from `e2e_workflow_generated.yml` as an individual
 * CodeBuild build (StartBuild, NOT StartBuildBatch), bypassing the batch
 * orchestrator whose un-chunked internal metadata call faults when too many
 * child builds are simultaneously in-progress. Because every build here has
 * `buildBatchArn === null` (no batch), the orchestrator fault threshold
 * (~25 safe / faults above ~100 simultaneous in-progress) does NOT apply.
 *
 * The only real ceiling is the ACCOUNT concurrency quota:
 *   - Linux / BUILD_GENERAL1_MEDIUM:   1,200
 *   - Windows Server 2022 / MEDIUM:      300  (tightest limit)
 * Linux and Windows shards therefore run as TWO INDEPENDENT pools in parallel,
 * each with its own cap. Defaults (75/platform) are conservative — bounded by
 * account quotas and courtesy to other users, NOT by the orchestrator
 * threshold — and can safely go much higher (e.g. ~250 Linux / ~200 Windows).
 *
 * Each standalone build reuses the prep S3 cache keyed on the resolved commit
 * SHA, so `--source-sha` must be the resolved commit (not a branch name).
 */

const PROJECT_NAME = 'AmplifyCLI-E2E-Testing';
const PROFILE_NAME = 'AmplifyE2EProd';
const REGION = 'us-east-1';
const POLL_INTERVAL_MS = 30 * 1000;
const BATCH_GET_LIMIT = 100;
const WINDOWS_ENVIRONMENT_TYPE = 'WINDOWS_SERVER_2022_CONTAINER';
const DEFAULT_LINUX_CONCURRENCY = 75;
const DEFAULT_WINDOWS_CONCURRENCY = 75;
const DEFAULT_DURATIONS_PATH = '.e2e-shard-durations.json';
const WORKFLOW_SPEC_PATH = join(REPO_ROOT, 'codebuild_specs', 'e2e_workflow_generated.yml');

type Platform = 'linux' | 'windows';
type TerminalStatus = 'SUCCEEDED' | 'FAILED' | 'FAULT' | 'STOPPED' | 'TIMED_OUT';
type LaunchOrder = 'longest-first' | 'shortest-first' | 'file';

interface Shard {
  readonly identifier: string;
  readonly buildspec: string;
  readonly testSuite: string;
  readonly platform: Platform;
  readonly region: string;
}

interface LauncherOptions {
  readonly sourceSha: string;
  readonly maxConcurrencyLinux: number;
  readonly maxConcurrencyWindows: number;
  readonly platform: 'linux' | 'windows' | 'both';
  readonly filter?: string;
  readonly limit?: number;
  readonly retryFailed: number;
  readonly durationsPath: string;
  readonly order: LaunchOrder;
}

interface ShardResult {
  readonly shard: Shard;
  readonly buildId: string;
  status: TerminalStatus;
}

/** Raw shape of a build-graph entry in the generated workflow spec. */
interface BuildGraphEntry {
  readonly identifier?: string;
  readonly buildspec?: string;
  readonly env?: { readonly variables?: Record<string, string> };
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

const parseArgs = (argv: readonly string[]): LauncherOptions => {
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : undefined;
  };

  const sourceSha = get('--source-sha');
  if (!sourceSha) {
    throw new Error('--source-sha <resolvedCommitSha> is required (the commit whose prep cache to reuse)');
  }

  const platformArg = (get('--platform') ?? 'both') as LauncherOptions['platform'];
  if (!['linux', 'windows', 'both'].includes(platformArg)) {
    throw new Error(`--platform must be one of linux|windows|both, got: ${platformArg}`);
  }

  const order = (get('--order') ?? 'longest-first') as LaunchOrder;
  if (!['longest-first', 'shortest-first', 'file'].includes(order)) {
    throw new Error(`--order must be one of longest-first|shortest-first|file, got: ${order}`);
  }

  // `--max-concurrency` is a convenience that sets both per-platform caps.
  const sharedCap = get('--max-concurrency') ? Number(get('--max-concurrency')) : undefined;

  return {
    sourceSha,
    maxConcurrencyLinux: get('--max-concurrency-linux') ? Number(get('--max-concurrency-linux')) : sharedCap ?? DEFAULT_LINUX_CONCURRENCY,
    maxConcurrencyWindows: get('--max-concurrency-windows')
      ? Number(get('--max-concurrency-windows'))
      : sharedCap ?? DEFAULT_WINDOWS_CONCURRENCY,
    platform: platformArg,
    filter: get('--filter'),
    limit: get('--limit') ? Number(get('--limit')) : undefined,
    retryFailed: Number(get('--retry-failed') ?? 0),
    durationsPath: get('--durations') ?? DEFAULT_DURATIONS_PATH,
    order,
  };
};

/**
 * Load the per-shard duration dataset (identifier → wall-clock minutes) produced
 * from a prior green batch. Returns an empty map (with a warning) when the file
 * is absent so duration ordering degrades gracefully to file order.
 */
const loadDurations = (options: LauncherOptions): ReadonlyMap<string, number> => {
  const path = isAbsolute(options.durationsPath) ? options.durationsPath : join(REPO_ROOT, options.durationsPath);
  if (!fs.existsSync(path)) {
    console.warn(`⚠️  durations file not found at ${path}; falling back to file order`);
    return new Map();
  }
  const raw = fs.readJsonSync(path) as { shard_durations?: Record<string, number> };
  return new Map(Object.entries(raw.shard_durations ?? {}));
};

/**
 * Order shards for launch. With `longest-first` (LPT heuristic) the longest
 * shards start in the earliest pool slots so they are never the tail of the
 * makespan; shards missing from the dataset are assumed to run for the median
 * duration. `file` preserves the workflow-spec order.
 */
const orderShards = (shards: readonly Shard[], durations: ReadonlyMap<string, number>, order: LaunchOrder): Shard[] => {
  if (order === 'file' || durations.size === 0) {
    return [...shards];
  }
  const values = [...durations.values()].sort((a, b) => a - b);
  const median = values.length === 0 ? 0 : values[Math.floor(values.length / 2)];
  const durationOf = (s: Shard): number => durations.get(s.identifier) ?? median;
  const sign = order === 'longest-first' ? -1 : 1;
  return [...shards].sort((a, b) => sign * (durationOf(a) - durationOf(b)));
};

/** Parse the generated workflow spec into the list of runnable e2e shards. */
const parseShards = (options: LauncherOptions): Shard[] => {
  const spec = yaml.load(fs.readFileSync(WORKFLOW_SPEC_PATH, 'utf-8')) as {
    batch?: { 'build-graph'?: BuildGraphEntry[] };
  };
  const graph = spec.batch?.['build-graph'] ?? [];

  const shards: Shard[] = [];
  let regionIndex = 0;
  for (const entry of graph) {
    const identifier = entry.identifier ?? '';
    const isLinux = identifier.startsWith('l_');
    const isWindows = identifier.startsWith('w_');
    if (!isLinux && !isWindows) {
      continue; // exclude prep/barrier/build/non-test groups
    }
    const platform: Platform = isWindows ? 'windows' : 'linux';
    if (options.platform !== 'both' && options.platform !== platform) {
      continue;
    }
    const testSuite = entry.env?.variables?.TEST_SUITE;
    const buildspec = entry.buildspec;
    if (!testSuite || !buildspec) {
      continue;
    }
    if (options.filter && !identifier.includes(options.filter)) {
      continue;
    }
    const region = AWS_REGIONS_TO_RUN_TESTS[regionIndex % AWS_REGIONS_TO_RUN_TESTS.length];
    regionIndex++;
    shards.push({ identifier, buildspec, testSuite, platform, region });
  }

  const ordered = orderShards(shards, loadDurations(options), options.order);
  return typeof options.limit === 'number' ? ordered.slice(0, options.limit) : ordered;
};

/** Resolve the project-level $WINDOWS_IMAGE_2019 ECR image for windows overrides. */
const resolveWindowsImage = async (client: CodeBuildClient): Promise<string> => {
  const { projects } = await client.send(new BatchGetProjectsCommand({ names: [PROJECT_NAME] }));
  const variable = projects?.[0]?.environment?.environmentVariables?.find((v) => v.name === 'WINDOWS_IMAGE_2019');
  if (!variable?.value) {
    throw new Error(`Could not resolve WINDOWS_IMAGE_2019 from project ${PROJECT_NAME} environment`);
  }
  return variable.value;
};

const startShardBuild = async (
  client: CodeBuildClient,
  shard: Shard,
  options: LauncherOptions,
  windowsImage: string | undefined,
): Promise<string> => {
  // CODEBUILD_BATCH_BUILD_IDENTIFIER is intentionally NOT injected: StartBuild
  // rejects any override whose name starts with the reserved `CODEBUILD_` prefix.
  // It is only consumed by select-region-for-e2e-test.ts to derive a region, and
  // that script short-circuits when CLI_REGION is already set — which we always do
  // here — so the batch identifier is unnecessary for standalone builds.
  const environmentVariablesOverride: EnvironmentVariable[] = [
    { name: 'TEST_SUITE', value: shard.testSuite, type: 'PLAINTEXT' },
    { name: 'CLI_REGION', value: shard.region, type: 'PLAINTEXT' },
  ];

  const { build } = await client.send(
    new StartBuildCommand({
      projectName: PROJECT_NAME,
      sourceVersion: options.sourceSha,
      buildspecOverride: shard.buildspec,
      environmentVariablesOverride,
      ...(shard.platform === 'windows' ? { imageOverride: windowsImage, environmentTypeOverride: WINDOWS_ENVIRONMENT_TYPE } : {}),
    }),
  );

  const buildId = build?.id;
  if (!buildId) {
    throw new Error(`StartBuild returned no build id for shard ${shard.identifier}`);
  }
  if (build?.buildBatchArn) {
    console.warn(`⚠️  ${shard.identifier} has buildBatchArn=${build.buildBatchArn} (orchestrator NOT bypassed)`);
  }
  return buildId;
};

/** Query terminal status for a set of build ids; undefined means still running. */
const getStatuses = async (client: CodeBuildClient, buildIds: readonly string[]): Promise<Map<string, TerminalStatus | undefined>> => {
  const statuses = new Map<string, TerminalStatus | undefined>();
  for (let i = 0; i < buildIds.length; i += BATCH_GET_LIMIT) {
    const ids = buildIds.slice(i, i + BATCH_GET_LIMIT);
    const { builds } = await client.send(new BatchGetBuildsCommand({ ids: [...ids] }));
    for (const build of builds ?? []) {
      if (!build.id) {
        continue;
      }
      const status = build.buildStatus;
      statuses.set(build.id, status === 'IN_PROGRESS' ? undefined : (status as TerminalStatus));
    }
  }
  return statuses;
};

/**
 * Run shards through a concurrency-capped pool, keeping at most
 * `maxConcurrency` builds simultaneously in flight. One pool is created per
 * platform; pools run independently and in parallel.
 */
const runPool = async (
  client: CodeBuildClient,
  shards: readonly Shard[],
  options: LauncherOptions,
  maxConcurrency: number,
  windowsImage: string | undefined,
): Promise<{ results: ShardResult[]; maxObservedConcurrency: number }> => {
  const queue = [...shards];
  const inflight = new Map<string, ShardResult>();
  const results: ShardResult[] = [];
  let maxObservedConcurrency = 0;

  while (queue.length > 0 || inflight.size > 0) {
    while (inflight.size < maxConcurrency && queue.length > 0) {
      const shard = queue.shift() as Shard;
      const buildId = await startShardBuild(client, shard, options, windowsImage);
      inflight.set(buildId, { shard, buildId, status: 'FAILED' });
      console.log(`▶️  started ${shard.identifier} [${shard.platform}/${shard.region}] build=${buildId} (inflight=${inflight.size})`);
    }

    maxObservedConcurrency = Math.max(maxObservedConcurrency, inflight.size);

    await sleep(POLL_INTERVAL_MS);

    const statuses = await getStatuses(client, [...inflight.keys()]);
    for (const [buildId, status] of statuses) {
      if (!status) {
        continue;
      }
      const result = inflight.get(buildId);
      if (!result) {
        continue;
      }
      result.status = status;
      results.push(result);
      inflight.delete(buildId);
      const icon = status === 'SUCCEEDED' ? '✅' : '❌';
      console.log(`${icon} ${result.shard.identifier} -> ${status} (inflight=${inflight.size}, remaining=${queue.length})`);
    }
  }

  return { results, maxObservedConcurrency };
};

const printSummary = (results: readonly ShardResult[], maxLinuxConcurrency: number, maxWindowsConcurrency: number): void => {
  const passed = results.filter((r) => r.status === 'SUCCEEDED');
  const failed = results.filter((r) => r.status !== 'SUCCEEDED');
  console.log('\n================ E2E STANDALONE SUMMARY ================');
  console.log(`Total: ${results.length} | Passed: ${passed.length} | Failed: ${failed.length}`);
  console.log(`Max simultaneous in-progress — linux: ${maxLinuxConcurrency}, windows: ${maxWindowsConcurrency}`);
  if (failed.length > 0) {
    console.log('\nFailed shards:');
    for (const r of failed) {
      console.log(`  ❌ ${r.shard.identifier} (${r.status}) build=${r.buildId}`);
    }
  }
  console.log('=======================================================\n');
};

/**
 * Run a single platform's shards through its own pool, then re-launch failed
 * shards up to `retryFailed` times. Returns the final per-shard results.
 */
const runPlatform = async (
  client: CodeBuildClient,
  shards: readonly Shard[],
  options: LauncherOptions,
  maxConcurrency: number,
  windowsImage: string | undefined,
): Promise<{ results: ShardResult[]; maxObservedConcurrency: number }> => {
  if (shards.length === 0) {
    return { results: [], maxObservedConcurrency: 0 };
  }
  let { results, maxObservedConcurrency } = await runPool(client, shards, options, maxConcurrency, windowsImage);

  for (let attempt = 1; attempt <= options.retryFailed; attempt++) {
    const failedShards = results.filter((r) => r.status !== 'SUCCEEDED').map((r) => r.shard);
    if (failedShards.length === 0) {
      break;
    }
    console.log(`\n🔁 [${shards[0].platform}] retry ${attempt}/${options.retryFailed} for ${failedShards.length} shard(s)`);
    results = results.filter((r) => r.status === 'SUCCEEDED');
    const retry = await runPool(client, failedShards, options, maxConcurrency, windowsImage);
    results = results.concat(retry.results);
    maxObservedConcurrency = Math.max(maxObservedConcurrency, retry.maxObservedConcurrency);
  }
  return { results, maxObservedConcurrency };
};

const main = async (): Promise<void> => {
  const options = parseArgs(process.argv.slice(2));
  const client = new CodeBuildClient({ credentials: fromIni({ profile: PROFILE_NAME }), region: REGION, maxAttempts: 10 });

  const shards = parseShards(options);
  if (shards.length === 0) {
    throw new Error('No shards matched the given filters');
  }
  const linuxShards = shards.filter((s) => s.platform === 'linux');
  const windowsShards = shards.filter((s) => s.platform === 'windows');
  console.log(
    `Launching ${shards.length} shard(s) — linux=${linuxShards.length} (cap ${options.maxConcurrencyLinux}), ` +
      `windows=${windowsShards.length} (cap ${options.maxConcurrencyWindows}), source-sha=${options.sourceSha}, order=${options.order}`,
  );

  const windowsImage = windowsShards.length > 0 ? await resolveWindowsImage(client) : undefined;

  // Linux and Windows run as two independent pools in parallel — their caps are
  // bounded by account quotas (Linux/Medium 1200, Windows/Medium 300), not by
  // the (inapplicable) batch-orchestrator threshold.
  const [linux, windows] = await Promise.all([
    runPlatform(client, linuxShards, options, options.maxConcurrencyLinux, windowsImage),
    runPlatform(client, windowsShards, options, options.maxConcurrencyWindows, windowsImage),
  ]);

  const results = [...linux.results, ...windows.results];
  printSummary(results, linux.maxObservedConcurrency, windows.maxObservedConcurrency);
  if (results.some((r) => r.status !== 'SUCCEEDED')) {
    process.exit(1);
  }
};

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
