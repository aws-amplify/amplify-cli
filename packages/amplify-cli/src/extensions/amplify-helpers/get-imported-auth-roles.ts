import _ from 'lodash';
import { $TSContext, $TSObject } from 'amplify-cli-core';

export const getImportedAuthRoles = (
  context: $TSContext,
): { imported: boolean; authRoleArn?: string; authRoleName?: string; unauthRoleArn?: string; unauthRoleName?: string } => {
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
      const resource: $TSObject = authResource[1] as $TSObject;

      // We have an imported resource, get the roles from the team provider info
      const envSpecificParameters = context.amplify.loadEnvResourceParameters(context, authCategoryName, resourceName);

      if (envSpecificParameters && envSpecificParameters.authRoleArn && envSpecificParameters.unauthRoleArn) {
        return {
          imported: true,
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
