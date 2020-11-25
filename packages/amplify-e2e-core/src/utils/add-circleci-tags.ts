import { stateManager } from 'amplify-cli-core';

export const addCircleCITags = (projectPath: string): void => {
  if (process.env && process.env['CIRCLE_CI']) {
    const tags = stateManager.getProjectTags(projectPath);

    const addTagIfNotExist = (key: string, value: string): void => {
      if (!tags.find(t => t.Key === key)) {
        tags.push({
          Key: key,
          Value: value,
        });
      }
    };

    addTagIfNotExist('circleci', process.env['CIRCLE_CI'] || 'N/A');
    addTagIfNotExist('circleci:branch', process.env['CIRCLE_BRANCH'] || 'N/A');
    addTagIfNotExist('circleci:sha1', process.env['CIRCLE_SHA1'] || 'N/A');
    addTagIfNotExist('circleci:workflow_id', process.env['CIRCLE_WORKFLOW_ID'] || 'N/A');

    stateManager.setProjectFileTags(projectPath, tags);
  }
};
