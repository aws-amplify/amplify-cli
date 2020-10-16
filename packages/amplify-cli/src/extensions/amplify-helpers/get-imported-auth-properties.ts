import _ from 'lodash';
import { $TSContext } from 'amplify-cli-core';

export const getImportedAuthProperties = (
  context: $TSContext,
): {
  imported: boolean;
  userPoolId?: string;
  authRoleArn?: string;
  authRoleName?: string;
  unauthRoleArn?: string;
  unauthRoleName?: string;
} => {
  const { amplifyMeta } = context.amplify.getProjectDetails();
  const authCategoryName = 'auth';
  const authServiceName = 'Cognito';

  const authCategory = _.get(amplifyMeta, [authCategoryName], undefined);

  if (authCategory) {
    const importedAuthResources = Object.entries(authCategory).filter(
      entry => (entry[1] as any).service === authServiceName && (entry[1] as any).serviceType === 'imported',
    );

    if (importedAuthResources.length === 1) {
      const authResource = importedAuthResources[0];
      const resourceName = authResource[0];

      // We have an imported resource, get the roles from the team provider info
      const envSpecificParameters = context.amplify.loadEnvResourceParameters(context, authCategoryName, resourceName);

      // Role specific parameters only mandatory if an identityPoolId also present in the envParameters
      if (
        envSpecificParameters &&
        envSpecificParameters.userPoolId &&
        (!envSpecificParameters.identityPoolId ||
          (!!envSpecificParameters.identityPoolId &&
            envSpecificParameters.authRoleArn &&
            envSpecificParameters.authRoleName &&
            envSpecificParameters.unauthRoleArn &&
            envSpecificParameters.unauthRoleName))
      ) {
        return {
          imported: true,
          userPoolId: envSpecificParameters.userPoolId,
          authRoleArn: envSpecificParameters.authRoleArn,
          authRoleName: envSpecificParameters.authRoleName,
          unauthRoleArn: envSpecificParameters.unauthRoleArn,
          unauthRoleName: envSpecificParameters.unauthRoleName,
        };
      }
    }
  }

  return {
    imported: false,
  };
};
