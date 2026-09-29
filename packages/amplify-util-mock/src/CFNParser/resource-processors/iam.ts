export function iamPolicyResourceHandler(resourceName, resource) {
  const processedResource = {
    cfnExposedAttributes: {},
    ref: `IAMPolicy${resource.Properties.PolicyName}`,
  };
  return processedResource;
}

export function iamRoleResourceHandler(resourceName, resource) {
  const processedResource = {
    cfnExposedAttributes: { Arn: 'Arn', RoleId: 'RoleId' },
    ref: `IAMRole${resource.Properties.RoleName}`,
    Arn: 'IAM-ARN',
    RoleId: `AIDAJQABLZS4A3QD${Math.floor(Math.random() * 100)}Q`,
  };
  return processedResource;
}
