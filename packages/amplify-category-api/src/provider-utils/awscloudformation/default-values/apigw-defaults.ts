import { v4 as uuid } from 'uuid';

export const getAllDefaults = (project: { projectConfig: { projectName: string } }) => {
  const name = project.projectConfig.projectName.toLowerCase().replace(/[^0-9a-zA-Z]/gi, '');
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `api${shortId}`,
    apiName: `${name}${shortId}`,
    paths: [],
  };

  return defaults;
};
