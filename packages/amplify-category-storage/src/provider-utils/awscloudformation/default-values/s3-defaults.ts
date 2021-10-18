
import { $TSAny } from 'amplify-cli-core';
import { v4 as uuid } from 'uuid';
import { S3AccessType, S3UserInputs } from '../service-walkthrough-types/s3-user-input-types';

export const getAllDefaults = (project: $TSAny, shortId : string) : S3UserInputs  => {
  const name = project.projectConfig.projectName.toLowerCase();
  const defaults : S3UserInputs = {
    resourceName: `s3${shortId}`,
    policyUUID : shortId,
    bucketName: `${name}${uuid().replace(/-/g, '')}`.substr(0, 47), // 63(max) - 10 (envName max) - 4(stack name) - 2(separators)
    storageAccess: S3AccessType.AUTH_ONLY,
    guestAccess: [],
    authAccess:  [],
    triggerFunction : undefined,
    groupAccess : {},
    groupList : []
  };

  return defaults;
};

type Project = { projectConfig: { projectName: string } };
