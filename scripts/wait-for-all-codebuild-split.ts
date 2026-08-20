import { CodeBuild } from 'aws-sdk';

/**
 * Polls TWO CodeBuild batches (the Linux-only and Windows-only batches produced by the split e2e
 * mode — see scripts/cloud-e2e.sh `cloudE2ESplit`) until both reach a terminal state, then reports
 * aggregate pass/fail across both. This is the local companion to the single-batch, in-CodeBuild
 * poller scripts/wait-for-all-codebuild.ts, which is left unchanged so the combined-batch path keeps
 * working.
 *
 * Usage: ts-node ./scripts/wait-for-all-codebuild-split.ts <linuxBatchId> <windowsBatchId>
 */

const TERMINAL_FAILURE_STATUSES = new Set(['FAILED', 'FAULT', 'STOPPED', 'TIMED_OUT']);
const IN_PROGRESS_STATUSES = new Set(['IN_PROGRESS', 'PENDING']);
const POLL_INTERVAL_MS = 180 * 1000;

type BatchStatus = {
  batchId: string;
  overallStatus: string;
  isComplete: boolean;
  incompleteJobs: string[];
  failedJobs: string[];
};

const getBatchStatus = async (cb: CodeBuild, batchId: string): Promise<BatchStatus> => {
  const retrievedBatchInfo = await cb.batchGetBuildBatches({ ids: [batchId] }).promise();
  const batch = retrievedBatchInfo.buildBatches?.[0];
  const overallStatus = batch?.buildBatchStatus ?? 'UNKNOWN';
  const groups = batch?.buildGroups ?? [];
  const incompleteJobs = groups
    .filter((group) => IN_PROGRESS_STATUSES.has(group.currentBuildSummary?.buildStatus ?? ''))
    .map((group) => group.identifier ?? '');
  const failedJobs = groups
    .filter((group) => TERMINAL_FAILURE_STATUSES.has(group.currentBuildSummary?.buildStatus ?? ''))
    .map((group) => group.identifier ?? '');
  return {
    batchId,
    overallStatus,
    isComplete: incompleteJobs.length === 0 && !IN_PROGRESS_STATUSES.has(overallStatus),
    incompleteJobs,
    failedJobs,
  };
};

const main = async () => {
  const batchIds = process.argv.slice(2).filter(Boolean);
  if (batchIds.length !== 2) {
    console.error('Expected exactly two batch IDs: <linuxBatchId> <windowsBatchId>');
    process.exit(1);
  }

  const cb = new CodeBuild({
    region: 'us-east-1',
    maxRetries: 10,
    retryDelayOptions: { base: 10 * 1000 },
  });

  console.log(`Polling ${batchIds.length} batches: ${JSON.stringify(batchIds)}`);

  const finalStatuses = new Map<string, BatchStatus>();
  let pending = [...batchIds];
  while (pending.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
    const stillPending: string[] = [];
    for (const batchId of pending) {
      const status = await getBatchStatus(cb, batchId);
      console.log(
        `batchId: ${batchId} - status: ${status.overallStatus} - incomplete: ${status.incompleteJobs.length} - failed: ${status.failedJobs.length}`,
      );
      if (status.isComplete) {
        finalStatuses.set(batchId, status);
      } else {
        stillPending.push(batchId);
      }
    }
    pending = stillPending;
  }

  let anyFailed = false;
  for (const batchId of batchIds) {
    const status = finalStatuses.get(batchId)!;
    const failed = status.failedJobs.length > 0 || TERMINAL_FAILURE_STATUSES.has(status.overallStatus);
    anyFailed = anyFailed || failed;
    console.log(`Batch ${batchId} ${failed ? 'FAILED' : 'SUCCEEDED'}. Failed jobs: ${JSON.stringify(status.failedJobs)}`);
  }

  if (anyFailed) {
    console.log('At least one batch failed. Exiting non-zero.');
    process.exit(1);
  }
  console.log('All batches succeeded.');
};

main().then(() => console.log('done'));
