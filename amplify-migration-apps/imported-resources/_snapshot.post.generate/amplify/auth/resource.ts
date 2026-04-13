import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'c643a9b272.userPoolId',
  identityPoolId: 'c643a9b272.identityPoolId',
  authRoleArn: 'arn:aws:iam::123456789012:role/importedresources-auth-role',
  unauthRoleArn: 'arn:aws:iam::123456789012:role/importedresources-unauth-role',
  userPoolClientId: 'e9df22841c.amplifyimportedresourcesgen2mainc643a9b272.deploymentType908544b6ddauthAmplifyRefAuthCustomResource4124D30CoauthClientId',
});
