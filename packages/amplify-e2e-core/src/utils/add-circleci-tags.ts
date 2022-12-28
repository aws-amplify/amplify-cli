import { stateManager } from 'amplify-cli-core';

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

export const addCircleCITags = (projectPath: string): void => {
  if (process.env && process.env['CIRCLECI']) {
    const tags = stateManager.getProjectTags(projectPath);

    const addTagIfNotExist = (key: string, value: string): void => {
      if (!tags.find(t => t.Key === key)) {
        tags.push({
          Key: key,
          Value: value,
        });
      }
    };

    addTagIfNotExist('circleci', sanitizeTagValue(process.env['CIRCLECI'] || 'N/A'));
    addTagIfNotExist('circleci:branch', sanitizeTagValue(process.env['CIRCLE_BRANCH'] || 'N/A'));
    addTagIfNotExist('circleci:sha1', sanitizeTagValue(process.env['CIRCLE_SHA1'] || 'N/A'));
    addTagIfNotExist('circleci:workflow_id', sanitizeTagValue(process.env['CIRCLE_WORKFLOW_ID'] || 'N/A'));
    addTagIfNotExist('circleci:build_id', sanitizeTagValue(process.env['CIRCLE_BUILD_NUM'] || 'N/A'));
    addTagIfNotExist('circleci:build_url', sanitizeTagValue(process.env['CIRCLE_BUILD_URL'] || 'N/A'));
    addTagIfNotExist('circleci:job', sanitizeTagValue(process.env['CIRCLE_JOB'] || 'N/A'));
    // exposed by custom CLI test environment
    if (global.getTestName) {
      addTagIfNotExist('jest:test_name', sanitizeTagValue(global.getTestName().substr(0, 255) || 'N/A'));
    }
    if (global.getHookName) {
      addTagIfNotExist('jest:hook_name', sanitizeTagValue(global.getHookName().substr(0, 255) || 'N/A'));
    }
    if (global.getDescibeBlocks) {
      global.getDescibeBlocks().forEach((blockName, i) => {
        addTagIfNotExist(`jest:describe_${i + 1}`, sanitizeTagValue(blockName.substr(0, 255) || 'N/A'));
      });
    }

    stateManager.setProjectFileTags(projectPath, tags);
  }
};

export function sanitizeTagValue(value: string): string {
  return value.replace(/[^ a-z0-9_.:/=+\-@]/gi, '');
}
