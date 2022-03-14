const uuid = require('uuid');

const getAllS3Defaults = project => {
  const name = project.projectConfig.projectName.toLowerCase();
  const [shortId] = uuid.v4().split('-');

  const authRoleName = {
    Ref: 'AuthRoleName',
  };

  const unauthRoleName = {
    Ref: 'UnauthRoleName',
  };

  const defaults = {
    resourceName: `s3${shortId}`,
    bucketName: `${name}${uuid.v4().replace(/-/g, '')}`,
    authPolicyName: `s3_amplify_${shortId}`,
    unauthPolicyName: `s3_amplify_${shortId}`,

    authRoleName,
    unauthRoleName,
    storageAccess: 'auth',
    selectedGuestPermissions: ['s3:GetObject', 's3:ListBucket'],
    selectedAuthenticatedPermissions: ['s3:GetObject', 's3:ListBucket'],
  };

  return defaults;
};

const getAllAuthDefaults = () => {
  const [policyId] = uuid.v4().split('-');
  const authAnswers = {
    AuthenticatedAllowList: 'ALLOW',
    GuestAllowList: 'DISALLOW',
    s3PermissionsAuthenticatedPrivate: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsAuthenticatedProtected: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsAuthenticatedPublic: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsAuthenticatedUploads: 's3:PutObject',
    s3PermissionsGuestPublic: 'DISALLOW',
    s3PermissionsGuestUploads: 'DISALLOW',
    s3PrivatePolicy: `Private_policy_${policyId}`,
    s3ProtectedPolicy: `Protected_policy_${policyId}`,
    s3PublicPolicy: `Public_policy_${policyId}`,
    s3ReadPolicy: `read_policy_${policyId}`,
    s3UploadsPolicy: `Uploads_policy_${policyId}`,
    selectedAuthenticatedPermissions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
  };

  return authAnswers;
};
const getAllAuthDefaultPerm = userInput => {
  userInput.authAccess = ['CREATE_AND_UPDATE', 'READ', 'DELETE'];
  userInput.guestAccess = [];
  return userInput;
};

const getAllAuthAndGuestDefaults = () => {
  const [policyId] = uuid.v4().split('-');
  const authAndGuestAnswers = {
    AuthenticatedAllowList: 'ALLOW',
    GuestAllowList: 'ALLOW',
    s3PermissionsAuthenticatedPrivate: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsAuthenticatedProtected: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsAuthenticatedPublic: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsAuthenticatedUploads: 's3:PutObject',
    s3PermissionsGuestPublic: 's3:PutObject,s3:GetObject,s3:DeleteObject',
    s3PermissionsGuestUploads: 's3:PutObject',
    s3PrivatePolicy: `Private_policy_${policyId}`,
    s3ProtectedPolicy: `Protected_policy_${policyId}`,
    s3PublicPolicy: `Public_policy_${policyId}`,
    s3ReadPolicy: `read_policy_${policyId}`,
    s3UploadsPolicy: `Uploads_policy_${policyId}`,
    selectedAuthenticatedPermissions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
    selectedGuestPermissions: ['s3:PutObject', 's3:GetObject', 's3:ListBucket', 's3:DeleteObject'],
  };

  return authAndGuestAnswers;
};

const getAllAuthAndGuestDefaultPerm = userInput => {
  userInput.authAccess = ['CREATE_AND_UPDATE', 'READ', 'DELETE'];
  userInput.guestAccess = ['CREATE_AND_UPDATE', 'READ', 'DELETE'];
  return userInput;
};

module.exports = {
  getAllS3Defaults,
  getAllAuthAndGuestDefaults,
  getAllAuthDefaults,
  getAllAuthDefaultPerm,
  getAllAuthAndGuestDefaultPerm,
};
