import { stateManager } from '@aws-amplify/amplify-cli-core';

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      getTestName?: () => string;
      getHookName?: () => string;
      getDescribeBlocks?: () => string[];
    }
  }
  /* eslint-enable */
}

export const addCICleanupTags = (projectPath: string): void => {
  const CIRCLECI = 'CIRCLECI';
  const CODEBUILD = 'CODEBUILD';
  let CI: string;
  let SHA1: string;
  let BUILD_ID: string;
  let BUILD_URL: string;
  let JOB: string;
  let WORKFLOW_ID: string;
  if (process?.env?.[CIRCLECI]) {
    CI = CIRCLECI;
    SHA1 = 'CIRCLE_SHA1';
    BUILD_ID = 'CIRCLE_BUILD_NUM';
    WORKFLOW_ID = 'CIRCLE_WORKFLOW_ID';
    JOB = 'CIRCLE_JOB';
  } else if (process?.env?.[`${CODEBUILD}_BUILD_ID`]) {
    CI = CODEBUILD;
    SHA1 = `${CODEBUILD}_RESOLVED_SOURCE_VERSION`;
    BUILD_ID = `${CODEBUILD}_BUILD_ID`;
    WORKFLOW_ID = `${CODEBUILD}_BATCH_BUILD_IDENTIFIER`;
    JOB = BUILD_ID;
    BUILD_URL = `${CODEBUILD}_PUBLIC_BUILD_URL`;
  } else {
    return;
  }

  const branch = CI === CIRCLECI ? process.env['CIRCLE_BRANCH'] : process.env[`${CODEBUILD}_WEBHOOK_HEAD_REF`];

  const tags = stateManager.getProjectTags(projectPath);

  const addTagIfNotExist = (key: string, value: string): void => {
    if (!tags.find((t) => t.Key === key)) {
      tags.push({
        Key: key,
        Value: value,
      });
    }
  };

  const ci = CI.toLowerCase();
  [
    [ci, CI === CIRCLECI ? process.env[CI] : process.env[`${CODEBUILD}_BUILD_IMAGE`]],
    [`${ci}:branch`, branch],
    [`${ci}:sha1`, process.env[SHA1]],
    [`${ci}:workflow_id`, process.env[WORKFLOW_ID]],
    [`${ci}:build_id`, process.env[BUILD_ID]],
    [`${ci}:build_url`, process.env[BUILD_URL]],
    [`${ci}:job`, process.env[JOB]],
    [`${ci}:create_time`, new Date().toISOString()],
  ].forEach(([key, value]) => addTagIfNotExist(key, sanitizeTagValue(value)));

  // exposed by custom CLI test environment
  if (global.getTestName) {
    addTagIfNotExist('jest:test_name', sanitizeTagValue(global.getTestName().substr(0, 255)));
  }
  if (global.getHookName) {
    addTagIfNotExist('jest:hook_name', sanitizeTagValue(global.getHookName().substr(0, 255)));
  }
  if (global.getDescribeBlocks) {
    global.getDescribeBlocks().forEach((blockName, i) => {
      addTagIfNotExist(`jest:describe_${i + 1}`, sanitizeTagValue(blockName.substr(0, 255)));
    });
  }

  stateManager.setProjectFileTags(projectPath, tags);
};

export function sanitizeTagValue(value = 'N/A'): string {
  return value.replace(/[^ a-z0-9_.:/=+\-@]/gi, '');
}
