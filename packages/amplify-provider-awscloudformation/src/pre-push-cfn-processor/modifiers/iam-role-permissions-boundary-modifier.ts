import { getPermissionsBoundaryArn } from 'amplify-cli-core';
import Role from 'cloudform-types/types/iam/role';
import { ResourceModifier } from '../pre-push-cfn-modifier';

export const iamRolePermissionsBoundaryModifier: ResourceModifier<Role> = async resource => {
  if (resource?.Properties?.PermissionsBoundary) {
    return resource; // don't modify an existing permissions boundary
  }
  const policyArn = getPermissionsBoundaryArn();
  if (!policyArn) {
    return resource; // exit if no permissions boundary specified
  }
  resource.Properties.PermissionsBoundary = policyArn;
  return resource;
};
