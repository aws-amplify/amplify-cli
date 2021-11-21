import { $TSMeta } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';

export const getAllDefaults = (project: { amplifyMeta: $TSMeta; projectConfig: { projectName: string } }) => {
  const name = project.projectConfig.projectName.toLowerCase();
  const region = project.amplifyMeta.providers.awscloudformation.Region;
  const [shortId] = uuid().split('-');
  const defaults = {
    resourceName: `appsync${shortId}`,
    apiName: `${name}`,
    serviceRoleName: `serviceRole${shortId}`,
    servicePolicyName: `servicePolicy${shortId}`,
    apiCreationChoice: false,
    region,
    defaultTableName: `Posts${shortId}`,
  };

  return defaults;
};
