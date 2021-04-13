import { getPermissionBoundaryArn } from 'amplify-cli-core';
import Role from 'cloudform-types/types/iam/role';
import { ResourceModifier } from '../pre-push-cfn-modifier';

export const iamRolePermissionBoundaryModifier: ResourceModifier = async (resource: Role) => {
  if (resource?.Properties?.PermissionsBoundary) {
    return; // don't modify an existing permission boundary
  }
  const policyArn = getPermissionBoundaryArn();
  if (!policyArn) {
    return; // exit if no permission boundary specified
  }
  resource.Properties.PermissionsBoundary = policyArn;
};
