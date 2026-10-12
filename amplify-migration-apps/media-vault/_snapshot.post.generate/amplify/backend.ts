import * as auth from './auth/resource';
import * as data from './data/resource';
import * as storage from './storage/resource';
import * as thumbnailgen from './function/thumbnailgen/resource';
import * as addusertogroup from './function/addusertogroup/resource';
import * as removeuserfromgroup from './function/removeuserfromgroup/resource';
import { defineBackend } from '@aws-amplify/backend';
import { Tags } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';

const backend = defineBackend({
  auth: auth.auth,
  data: data.data,
  storage: storage.storage,
  thumbnailgen: thumbnailgen.thumbnailgen,
  addusertogroup: addusertogroup.addusertogroup,
  removeuserfromgroup: removeuserfromgroup.removeuserfromgroup,
});

export type Backend = typeof backend;

backend.auth.resources.userPool.grant(
  backend.addusertogroup.resources.lambda,
  'cognito-idp:AdminAddUserToGroup',
  'cognito-idp:AdminConfirmSignUp',
  'cognito-idp:AdminCreateUser',
  'cognito-idp:AdminDeleteUser',
  'cognito-idp:AdminDeleteUserAttributes',
  'cognito-idp:AdminDisableUser',
  'cognito-idp:AdminEnableUser',
  'cognito-idp:AdminForgetDevice',
  'cognito-idp:AdminGetDevice',
  'cognito-idp:AdminGetUser',
  'cognito-idp:AdminListDevices',
  'cognito-idp:AdminListGroupsForUser',
  'cognito-idp:AdminRemoveUserFromGroup',
  'cognito-idp:AdminResetUserPassword',
  'cognito-idp:AdminRespondToAuthChallenge',
  'cognito-idp:AdminSetUserMFAPreference',
  'cognito-idp:AdminSetUserPassword',
  'cognito-idp:AdminSetUserSettings',
  'cognito-idp:AdminUpdateDeviceStatus',
  'cognito-idp:AdminUpdateUserAttributes',
  'cognito-idp:AdminUserGlobalSignOut',
  'cognito-idp:CreateGroup',
  'cognito-idp:DeleteGroup',
  'cognito-idp:ListGroups',
  'cognito-idp:ListUsers',
  'cognito-idp:ListUsersInGroup',
  'cognito-idp:UpdateGroup'
);
backend.auth.resources.userPool.grant(
  backend.removeuserfromgroup.resources.lambda,
  'cognito-idp:AdminAddUserToGroup',
  'cognito-idp:AdminConfirmSignUp',
  'cognito-idp:AdminCreateUser',
  'cognito-idp:AdminDeleteUser',
  'cognito-idp:AdminDeleteUserAttributes',
  'cognito-idp:AdminDisableUser',
  'cognito-idp:AdminEnableUser',
  'cognito-idp:AdminForgetDevice',
  'cognito-idp:AdminGetDevice',
  'cognito-idp:AdminGetUser',
  'cognito-idp:AdminListDevices',
  'cognito-idp:AdminListGroupsForUser',
  'cognito-idp:AdminRemoveUserFromGroup',
  'cognito-idp:AdminResetUserPassword',
  'cognito-idp:AdminRespondToAuthChallenge',
  'cognito-idp:AdminSetUserMFAPreference',
  'cognito-idp:AdminSetUserPassword',
  'cognito-idp:AdminSetUserSettings',
  'cognito-idp:AdminUpdateDeviceStatus',
  'cognito-idp:AdminUpdateUserAttributes',
  'cognito-idp:AdminUserGlobalSignOut',
  'cognito-idp:CreateGroup',
  'cognito-idp:DeleteGroup',
  'cognito-idp:ListGroups',
  'cognito-idp:ListUsers',
  'cognito-idp:ListUsersInGroup',
  'cognito-idp:UpdateGroup'
);
backend.thumbnailgen.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:DeleteObject', 's3:GetObject', 's3:PutObject', 's3:ListBucket'],
    resources: [backend.storage.resources.bucket.arnForObjects('*'), backend.storage.resources.bucket.bucketArn],
  })
);

auth.applyEscapeHatches(backend);
data.applyEscapeHatches(backend);
storage.applyEscapeHatches(backend);
thumbnailgen.applyEscapeHatches(backend);
addusertogroup.applyEscapeHatches(backend);
removeuserfromgroup.applyEscapeHatches(backend);

export function postRefactor() {
  auth.postRefactor(backend);
  storage.postRefactor(backend);
  Tags.of(backend.stack).add('gen2-migration/post-refactor', 'true');
}

// Uncomment after refactor
// postRefactor();
