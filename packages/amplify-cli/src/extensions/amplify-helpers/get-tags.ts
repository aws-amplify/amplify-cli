import { stateManager, Tag, HydrateTags } from 'amplify-cli-core';
import { Context } from '../../domain/context';

export function getTags(context: Context): Tag[] {
  if (stateManager.isTagFilePresent()) {
    return stateManager.getHydratedTags();
  } else {
    const tags = context.exeInfo.initialTags;
    const { envName } = context.exeInfo.localEnvInfo;
    const { projectName } = context.exeInfo.projectConfig;
    return HydrateTags(tags, { envName, projectName });
  }
}
