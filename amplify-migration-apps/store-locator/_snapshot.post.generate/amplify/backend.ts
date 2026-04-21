import { auth } from './auth/resource';
import { storelocator41a9495f41a9495fPostConfirmation } from './auth/storelocator41a9495f41a9495fPostConfirmation/resource';
import { defineGeo } from './geo/resource';
import { defineBackend } from '@aws-amplify/backend';
import { CfnResource, Duration } from 'aws-cdk-lib';

const backend = defineBackend({
  auth,
  storelocator41a9495f41a9495fPostConfirmation,
});
const geo = defineGeo(backend);
const cfnUserPool = backend.auth.resources.cfnResources.cfnUserPool;
cfnUserPool.usernameAttributes = ['email'];
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireUppercase: false,
    requireLowercase: false,
    requireNumbers: false,
    requireSymbols: false,
    temporaryPasswordValidityDays: 7,
  },
};
const userPool = backend.auth.resources.userPool;
userPool.addClient('NativeAppClient', {
  refreshTokenValidity: Duration.days(100),
  enableTokenRevocation: true,
  enablePropagateAdditionalUserContextData: false,
  authSessionValidity: Duration.minutes(3),
  disableOAuth: true,
  generateSecret: false,
});
const branchName = process.env.AWS_BRANCH ?? 'sandbox';
backend.storelocator41a9495f41a9495fPostConfirmation.resources.cfnResources.cfnFunction.functionName = `storelocator41a9495f41a9495fPostConfirmation-${branchName}`;
for (const cfnResource of backend.auth.stack.node
  .findAll()
  .filter(
    (c) =>
      CfnResource.isCfnResource(c) &&
      [
        'AWS::Cognito::UserPool',
        'AWS::Cognito::IdentityPool',
        'AWS::Cognito::UserPoolClient',
        'AWS::Cognito::IdentityPoolRoleAttachment',
        'AWS::Cognito::UserPoolDomain',
        'AWS::Cognito::UserPoolGroup',
      ].includes(c.cfnResourceType)
  )) {
  (cfnResource as CfnResource).addOverride('UpdateReplacePolicy', 'Retain');
  (cfnResource as CfnResource).addOverride('DeletionPolicy', 'Retain');
}
