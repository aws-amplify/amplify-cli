const { JSONUtilities, pathManager } = require('amplify-cli-core');
const path = require('path');
const { generateUserPoolGroupStackTemplate } = require('./generate-user-pool-group-stack-template');
const { AuthInputState } = require('../auth-inputs-manager/auth-input-state');

async function transformUserPoolGroupSchema(context) {
  const userPoolPrecedencePath = path.join(pathManager.getBackendDirPath(), 'auth', 'userPoolGroups', 'user-pool-group-precedence.json');

  const { allResources } = await context.amplify.getResourceStatus();
  const authResource = allResources.filter(resource => resource.service === 'Cognito');
  let authResourceName;

  if (authResource.length > 0) {
    const resource = authResource[0];
    authResourceName = resource.resourceName;
  } else {
    throw new Error('Cognito UserPool does not exists');
  }

  const groups = JSONUtilities.readJson(userPoolPrecedencePath);

  // Replace env vars with subs

  groups.forEach(group => {
    if (group.customPolicies) {
      group.customPolicies.forEach(policy => {
        if (policy.PolicyDocument && policy.PolicyDocument.Statement) {
          policy.PolicyDocument.Statement.forEach(statement => {
            // eslint-disable-next-line
            if (statement.Resource.includes('${env}')) {
              // eslint-disable-line
              statement.Resource = { 'Fn::Sub': [statement.Resource, { env: { Ref: 'env' } }] };
            }
          });
        }
      });
    }
  });

  // validating cli-inputs
  const cliState = new AuthInputState(authResourceName);
  const identityPoolName = cliState.getCLIInputPayload().identityPoolName;
  const props = {
    groups,
    cognitoResourceName: authResourceName,
    identityPoolName: identityPoolName,
  };

  await generateUserPoolGroupStackTemplate(props);
}

module.exports = {
  transformUserPoolGroupSchema,
};
