import { stateManager, Tag, HydrateTags } from 'amplify-cli-core';
import { Context } from '../../domain/context';

export function getTags(context: Context): Tag[] {
  if (stateManager.isTagFilePresent()) {
    return stateManager.getHydratedTags();
  } else {
    const { envName } = context.exeInfo.localEnvInfo;
    const { projectName } = context.exeInfo.projectConfig;
    return HydrateTags(initialTags, { envName, projectName });
  }
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
