import {
  $TSObject, HydrateTags, pathManager, stateManager, Tag,
} from 'amplify-cli-core';
import { Context } from '../../domain/context';

/**
 * get project tags for the current environment
 */
export const getTags = (context: Context): Tag[] => {
  let tags: Tag[];
  let envInfo: $TSObject;
  let projectConfig: $TSObject;
  const projectRoot = pathManager.findProjectRoot();
  if (stateManager.isTagFilePresent(projectRoot)) {
    tags = stateManager.getProjectTags(projectRoot);
  } else {
    tags = initialTags;
  }
  if (stateManager.localEnvInfoExists(projectRoot) && stateManager.projectConfigExists(projectRoot)) {
    envInfo = stateManager.getLocalEnvInfo(projectRoot);
    projectConfig = stateManager.getProjectConfig(projectRoot);
  } else {
    envInfo = context.exeInfo.localEnvInfo;
    projectConfig = context.exeInfo.projectConfig;
  }
  const { envName } = envInfo;
  const { projectName } = projectConfig;
  return HydrateTags(tags, { envName, projectName });
};

const initialTags: Tag[] = [
  {
    Key: 'user:Stack',
    Value: '{project-env}',
  },
  {
    Key: 'user:Application',
    Value: '{project-name}',
  },
];
