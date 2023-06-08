import { stateManager } from '@aws-amplify/amplify-cli-core';

declare global {
  /* eslint-disable @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      getTestName?: () => string;
      getHookName?: () => string;
      getDescibeBlocks?: () => string[];
    }
  }
  /* eslint-enable */
}

export const addCICleanupTags = (projectPath: string): void => {
  const CIRCLECI = 'CIRCLECI';
  const CODEBUILD = 'CODEBUILD';
  let CI: string;
  let SHA1: string;
  let BUILD_NUMBER: string;
  let BUILD_ID: string;
  let BUILD_URL: string;
  let JOB: string;
  let WORKFLOW_ID: string;
  if (process?.env?.[CIRCLECI]) {
    CI = CIRCLECI;
    SHA1 = 'CIRCLE_SHA1';
    BUILD_NUMBER = `CIRCLE_BUILD_NUM`;
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

  let branch = CI === CIRCLECI ? process.env['CIRCLE_BRANCH'] : process.env[`${CODEBUILD}_WEBHOOK_HEAD_REF`];

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
  addTagIfNotExist(ci, sanitizeTagValue(CI === CIRCLECI ? process.env[CI] : process.env[`${CODEBUILD}_BUILD_IMAGE`]));
  addTagIfNotExist(`${ci}:branch`, sanitizeTagValue(branch));
  addTagIfNotExist(`${ci}:sha1`, sanitizeTagValue(process.env[SHA1]));
  addTagIfNotExist(`${ci}:workflow_id`, sanitizeTagValue(process.env[WORKFLOW_ID]));
  addTagIfNotExist(`${ci}:build_id`, sanitizeTagValue(process.env[BUILD_ID]));
  addTagIfNotExist(`${ci}:build_url`, sanitizeTagValue(process.env[BUILD_URL]));
  addTagIfNotExist(`${ci}:job`, sanitizeTagValue(process.env[JOB]));
  addTagIfNotExist(`${ci}:create_time`, new Date().toISOString());
  // exposed by custom CLI test environment
  if (global.getTestName) {
    addTagIfNotExist('jest:test_name', sanitizeTagValue(global.getTestName().substr(0, 255)));
  }
  if (global.getHookName) {
    addTagIfNotExist('jest:hook_name', sanitizeTagValue(global.getHookName().substr(0, 255)));
  }
  if (global.getDescibeBlocks) {
    global.getDescibeBlocks().forEach((blockName, i) => {
      addTagIfNotExist(`jest:describe_${i + 1}`, sanitizeTagValue(blockName.substr(0, 255)));
    });
  }

  stateManager.setProjectFileTags(projectPath, tags);
};

export function sanitizeTagValue(value: string = 'N/A'): string {
  return value.replace(/[^ a-z0-9_.:/=+\-@]/gi, '');
}
