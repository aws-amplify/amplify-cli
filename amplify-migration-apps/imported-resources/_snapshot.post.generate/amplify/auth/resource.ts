import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'auth.importedresources2c7c1c40.UserPoolId',
  identityPoolId: 'auth.importedresources2c7c1c40.IdentityPoolId',
  authRoleArn: 'arn:aws:iam::123456789012:role/importedresources-auth-role',
  unauthRoleArn: 'arn:aws:iam::123456789012:role/importedresources-unauth-role',
  userPoolClientId: 'auth.importedresources2c7c1c40.AppClientIDWeb',
});
