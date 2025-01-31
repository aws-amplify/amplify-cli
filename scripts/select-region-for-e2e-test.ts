import { AWS_REGIONS_TO_RUN_TESTS } from './cci-utils';
import * as fs from 'fs-extra';
import path from 'path';

/**
 * This script prints region assignment for an e2e test job.
 * The algorithm takes input via environment variable - CODEBUILD_BATCH_BUILD_IDENTIFIER
 * and computes deterministic region assignment by looking at position
 * of build job in 'wait_for_ids.json' file.
 * In order to reshuffle regions 'offset' constant below should be modified.
 *
 * If region is already assigned, i.e. CLI_REGION environment variable is set this script is pass-through.
 */

// if region is specified by job honor it.
let selectedRegion = process.env.CLI_REGION;
if (!selectedRegion) {
  const jobId = process.env.CODEBUILD_BATCH_BUILD_IDENTIFIER;
  if (!jobId) {
    throw Error('CODEBUILD_BATCH_BUILD_IDENTIFIER environment variable must be set');
  }
  // Offset should be changed if we want re-shuffle regions.
  const offset = 0;
  const waitForIdsFilePath = path.join('.', 'codebuild_specs', 'wait_for_ids.json');
  const jobIds = JSON.parse(fs.readFileSync(waitForIdsFilePath, 'utf-8')) as Array<string>;
  let jobPosition = jobIds.indexOf(jobId);
  if (jobPosition < 0) {
    // this should never happen if PR checks pass, but just in case fall back to first region.
    jobPosition = 0;
  }
  const regionIndex = (jobPosition + offset) % AWS_REGIONS_TO_RUN_TESTS.length;

  selectedRegion = AWS_REGIONS_TO_RUN_TESTS[regionIndex];
}

console.log(selectedRegion);
