
import { $TSAny } from 'amplify-cli-core';
import uuid from 'uuid';
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
    groupAccess : {}
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
