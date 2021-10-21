import { v4 as uuid } from 'uuid';

export const getAllDefaults = (project: Project) => {
  const name = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid().split('-');

  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const defaults = {
    resourceName: `s3${shortId}`,
    bucketName: `${name}${uuid().replace(/-/g, '')}`.substr(0, 47), // 63(max) - 10 (envName max) - 4(stack name) - 2(separators)
    authPolicyName: `s3_amplify_${shortId}`,
    unauthPolicyName: `s3_amplify_${shortId}`,
    authRoleName,
    unauthRoleName,
    storageAccess: 'auth',
    selectedGuestPermissions: ['s3:GetObject', 's3:ListBucket'],
    selectedAuthenticatedPermissions: ['s3:GetObject', 's3:ListBucket'],
    triggerFunction: 'NONE',
  };

  return defaults;
};

type Project = { projectConfig: { projectName: string } };
