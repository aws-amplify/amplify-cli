import { referenceAuth } from '@aws-amplify/backend';

export const auth = referenceAuth({
  userPoolId: 'us-east-1_8feoXFV6v',
  identityPoolId: 'us-east-1:12def580-cd20-405f-accf-51c866797e48',
  authRoleArn: 'arn:aws:iam::123456789012:role/importedresources-auth-role',
  unauthRoleArn: 'arn:aws:iam::123456789012:role/importedresources-unauth-role',
  userPoolClientId: '2oi4chvjmec9shclb000688s9a',
});
