import { stateManager, Tag, HydrateTags, $TSAny } from 'amplify-cli-core';
import { Context } from '../../domain/context';

export function getTags(context: Context): Tag[] {
  let tags: Tag[];
  let envInfo: $TSAny;
  let projectConfig: $TSAny;
  if (stateManager.isTagFilePresent()) {
    tags = stateManager.getProjectTags();
  } else {
    tags = initialTags;
  }
  if (stateManager.localEnvInfoExists() && stateManager.projectConfigExists()) {
    envInfo = stateManager.getLocalEnvInfo();
    projectConfig = stateManager.getProjectConfig();
  } else {
    envInfo = context.exeInfo.localEnvInfo;
    projectConfig = context.exeInfo.projectConfig;
  }
  const { envName } = envInfo;
  const { projectName } = projectConfig;
  return HydrateTags(tags, { envName, projectName });
}

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
