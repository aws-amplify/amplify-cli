const uuid = require('uuid');

const getAllDefaults = (project) => {
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
    bucketName: `${name}${uuid().replace(/-/g, '')}`,
    authPolicyName: `s3_amplify_${shortId}`,
    unauthPolicyName: `s3_amplify_${shortId}`,


    authRoleName,
    unauthRoleName,
    storageAccess: 'auth',
    selectedGuestPermissions: ['s3:GetObject', 's3:ListBucket'],
    selectedAuthenticatedPermissions: ['s3:GetObject', 's3:ListBucket'],

    s3PermissionsGuestPublic: 'DISALLOW',
    s3PermissionsGuestUploads: 'DISALLOW',
    GuestAllowList: 'DISALLOW',
  };

  return defaults;
};

module.exports = {
  getAllDefaults,
};
