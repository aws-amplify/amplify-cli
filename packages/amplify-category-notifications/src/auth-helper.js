const ora = require('ora');
const os = require('os');
const constants = require('./constants');

const providerName = 'awscloudformation';
const policyNamePrefix = 'pinpoint_amplify-';
const spinner = ora('');

async function ensureAuth(context, resourceName) {
  try {
    spinner.start('Creating and attaching IAM policy.');
    const policy = await createPolicy(context);
    await attachPolicy(context, policy);
    spinner.succeed('Successfully set the IAM policy');
  } catch (e) {
    spinner.fail('Error occurred during IAM policy setup.');
    throw e;
  }
  await checkAuth(context, resourceName);
}

async function createPolicy(context) {
  const params = {
    PolicyName: getPolicyName(context),
    PolicyDocument: getPolicyDoc(context),
  };
  const iamClient = await getIamClient(context);
  return new Promise((resolve, reject) => {
    iamClient.createPolicy(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Policy);
      }
    });
  });
}

async function attachPolicy(context, policy) {
  const { amplifyMeta } = context.exeInfo;
  const authRoleName = amplifyMeta.providers[providerName].AuthRoleName;
  const unAuthRoleName = amplifyMeta.providers[providerName].UnauthRoleName;
  await attachPolicyToRole(context, policy, authRoleName);
  await attachPolicyToRole(context, policy, unAuthRoleName);
}

async function attachPolicyToRole(context, policy, roleName) {
  const params = {
    RoleName: roleName,
    PolicyArn: policy.Arn,
  };
  const iamClient = await getIamClient(context, 'update');
  return new Promise((resolve, reject) => {
    iamClient.attachRolePolicy(params, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

async function deletePolicy(context, policyArn) {
  const params = {
    PolicyArn: policyArn,
  };
  const iamClient = await getIamClient(context);
  return iamClient.deletePolicy(params).promise();
}

async function detachPolicyFromRole(context, policyArn, roleName) {
  const params = {
    PolicyArn: policyArn,
    RoleName: roleName,
  };
  const iamClient = await getIamClient(context);
  return iamClient.detachRolePolicy(params).promise();
}

async function listAttachedRolePolicies(context, roleName) {
  const params = { RoleName: roleName };
  const iamClient = await getIamClient(context);
  return iamClient.listAttachedRolePolicies(params).promise();
}

async function deleteRolePolicy(context) {
  const amplifyMeta = context.amplify.getProjectMeta();
  const authRoleName = amplifyMeta.providers[providerName].AuthRoleName;
  const unAuthRoleName = amplifyMeta.providers[providerName].UnauthRoleName;
  const rolePolicies = await listAttachedRolePolicies(context, authRoleName);

  if (rolePolicies && Array.isArray(rolePolicies.AttachedPolicies)) {
    const policy = rolePolicies.AttachedPolicies.find(policy => policy.PolicyName.startsWith(policyNamePrefix));

    if (policy) {
      await detachPolicyFromRole(context, policy.PolicyArn, authRoleName);
      await detachPolicyFromRole(context, policy.PolicyArn, unAuthRoleName);
      await deletePolicy(context, policy.PolicyArn);
    }
  }
}

async function checkAuth(context, resourceName) {
  const apiRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
  const checkResult = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    apiRequirements,
    context,
    constants.CategoryName,
    resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new Error(checkResult.errors.join(os.EOL));
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    context.print.warning(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    try {
      context.print.warning(`Adding ${constants.CategoryName} would also add the Auth category to the project if not already added.`);

      await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
        context,
        constants.CategoryName,
        resourceName,
        apiRequirements,
      ]);

      context.print.warning('Execute "amplify push" to update the Auth resources in the cloud.');
    } catch (error) {
      context.print.error(error);
      throw error;
    }
  }
}

async function getIamClient(context, action) {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  const provider = require(providerPlugins[providerName]);
  const aws = await provider.getConfiguredAWSClient(context, constants.CategoryName, action);
  return new aws.IAM();
}

function getPolicyDoc(context) {
  const { amplifyMeta, pinpointApp } = context.exeInfo;
  const authRoleArn = amplifyMeta.providers[providerName].AuthRoleArn;
  const accountNumber = authRoleArn.split(':')[4];
  const pinpointAppId = pinpointApp.Id;
  const policy = {
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Action: ['mobiletargeting:PutEvents', 'mobiletargeting:UpdateEndpoint'],
        Resource: [`arn:aws:mobiletargeting:*:${accountNumber}:apps/${pinpointAppId}*`],
      },
    ],
  };
  return JSON.stringify(policy);
}

function getPolicyName(context) {
  return `${policyNamePrefix}${context.amplify.makeId(8)}`;
}

module.exports = {
  deleteRolePolicy,
  ensureAuth,
};
