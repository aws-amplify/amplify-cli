import { stateManager, Tag } from 'amplify-cli-core';
import { getProjectDetails } from './get-project-details';
export function getTags(): Tag[] {
  const projectDetails = getProjectDetails();
  const { projectName } = projectDetails.projectConfig;
  const { envName } = projectDetails.localEnvInfo;
  return HydrateTags(stateManager.getProjectTags(), { envName, projectName });
}

function HydrateTags(tags: Tag[], tagVariables: TagVariables): Tag[] {
  const { envName, projectName } = tagVariables;
  const replace = {
    '{project-name}': projectName,
    '{project-env}': envName,
  };
  return tags.map(tag => {
    return {
      ...tag,
      Value: tag.Value.replace(/{project-name}|{project-env}/g, (matched: string) => replace[matched]),
    };
  });
}

type TagVariables = {
  envName: string;
  projectName: string;
};
