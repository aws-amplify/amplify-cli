const ora = require('ora');
const constants = require('./constants');

const providerName = 'awscloudformation';
const spinner = ora('');

async function ensureAuth(context) {
  try {
    spinner.start('Creating and attaching IAM policy.');
    const policy = await createPolicy(context);
    await attachPolicy(context, policy);
    spinner.succeed('Successfully set the IAM policy');
  } catch (e) {
    spinner.fail('Error occured during IAM policy setup.');
    throw e;
  }
  await checkAuth(context);
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
  const iamClient = await getIamClient(context);
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

async function checkAuth(context) {
  const { checkRequirements, externalAuthEnable } = require('amplify-category-auth');

  const apiRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
  const satisfiedRequirements = await checkRequirements(apiRequirements, context);
  const foundUnmetRequirements = Object.values(satisfiedRequirements).includes(false);

  if (foundUnmetRequirements) {
    context.print.warning(`Adding ${constants.CategoryName} would also add the Auth category to the project if not already added.`);
    try {
      await externalAuthEnable(context, constants.CategoryName, '', apiRequirements);
      context.print.warning('Execute "amplify push" to update the Auth resources in the cloud.');
    } catch (e) {
      context.print.error(e);
      throw e;
    }
  }
}

async function getIamClient(context) {
  const { projectConfig } = context.exeInfo;
  const provider = require(projectConfig.providers[providerName]);
  const aws = await provider.getConfiguredAWSClient(context);
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
        Action: [
          'mobileanalytics:PutEvents',
        ],
        Resource: [
          '*',
        ],
      },
      {
        Effect: 'Allow',
        Action: [
          'mobiletargeting:UpdateEndpoint',
        ],
        Resource: [
          `arn:aws:mobiletargeting:*:${accountNumber}:apps/${pinpointAppId}*`,
        ],
      },
    ],
  };
  return JSON.stringify(policy);
}

function getPolicyName(context) {
  return `pinpoint_amplify-${context.amplify.makeId(8)}`;
}

module.exports = {
  ensureAuth,
};
