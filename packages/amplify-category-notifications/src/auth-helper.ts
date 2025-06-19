import { $TSAny, $TSContext, AmplifyCategories, AmplifyError } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import ora from 'ora';
import os from 'os';
import IAM from 'aws-sdk/clients/iam';

const providerName = 'awscloudformation';
const policyNamePrefix = 'pinpoint_amplify-';
const spinner = ora('');

/**
 * Ensure Auth policies are created for Notifications resource
 */
export const ensureAuth = async (context: $TSContext, resourceName: string): Promise<void> => {
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
};

const createPolicy = async (context: $TSContext): Promise<$TSAny> => {
  const params = {
    PolicyName: getPolicyName(context),
    PolicyDocument: getPolicyDoc(context),
  };
  const iamClient = await getIamClient(context, undefined);
  return new Promise((resolve, reject) => {
    iamClient.createPolicy(params, (err: $TSAny, data: $TSAny) => {
      if (err) {
        reject(err);
      } else {
        resolve(data.Policy);
      }
    });
  });
};

const attachPolicy = async (context: $TSContext, policy: $TSAny): Promise<void> => {
  const { amplifyMeta } = context.exeInfo;
  const authRoleName = amplifyMeta.providers[providerName].AuthRoleName;
  const unAuthRoleName = amplifyMeta.providers[providerName].UnauthRoleName;
  await attachPolicyToRole(context, policy, authRoleName);
  await attachPolicyToRole(context, policy, unAuthRoleName);
};

const attachPolicyToRole = async (context: $TSContext, policy: $TSAny, roleName: string): Promise<$TSAny> => {
  const params = {
    RoleName: roleName,
    PolicyArn: policy.Arn,
  };
  const iamClient = await getIamClient(context, 'update');
  return new Promise((resolve, reject) => {
    iamClient.attachRolePolicy(params, (err: $TSAny, data: $TSAny) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
};

const deletePolicy = async (context: $TSContext, policyArn: string): Promise<$TSAny> => {
  const params = {
    PolicyArn: policyArn,
  };
  const iamClient = await getIamClient(context, undefined);
  return iamClient.deletePolicy(params).promise();
};

const detachPolicyFromRole = async (context: $TSContext, policyArn: string, roleName: string): Promise<$TSAny> => {
  const params = {
    PolicyArn: policyArn,
    RoleName: roleName,
  };
  const iamClient = await getIamClient(context, undefined);
  return iamClient.detachRolePolicy(params).promise();
};

const listAttachedRolePolicies = async (context: $TSContext, roleName: string): Promise<$TSAny> => {
  const params = { RoleName: roleName };
  const iamClient = await getIamClient(context, undefined);
  return iamClient.listAttachedRolePolicies(params).promise();
};

/**
 * Delete All the IAM Policies added by Notifications from the Auth/UnAuthRoles
 */
export const deleteRolePolicy = async (context: $TSContext): Promise<void> => {
  const amplifyMeta = context.amplify.getProjectMeta();
  const authRoleName = amplifyMeta.providers[providerName].AuthRoleName;
  const unAuthRoleName = amplifyMeta.providers[providerName].UnauthRoleName;
  const rolePolicies = await listAttachedRolePolicies(context, authRoleName);

  if (rolePolicies && Array.isArray(rolePolicies.AttachedPolicies)) {
    const policy = rolePolicies.AttachedPolicies.find((attachedPolicy: $TSAny) => attachedPolicy.PolicyName.startsWith(policyNamePrefix));

    if (policy) {
      await detachPolicyFromRole(context, policy.PolicyArn, authRoleName);
      await detachPolicyFromRole(context, policy.PolicyArn, unAuthRoleName);
      await deletePolicy(context, policy.PolicyArn);
    }
  }
};

const checkAuth = async (context: $TSContext, resourceName: string): Promise<void> => {
  const apiRequirements = { authSelections: 'identityPoolOnly', allowUnauthenticatedIdentities: true };
  const checkResult: $TSAny = await context.amplify.invokePluginMethod(context, 'auth', undefined, 'checkRequirements', [
    apiRequirements,
    context,
    AmplifyCategories.NOTIFICATIONS,
    resourceName,
  ]);

  // If auth is imported and configured, we have to throw the error instead of printing since there is no way to adjust the auth
  // configuration.
  if (checkResult.authImported === true && checkResult.errors && checkResult.errors.length > 0) {
    throw new AmplifyError('ConfigurationError', {
      message: 'The imported auth config is not compatible with the specified notifications config',
      details: checkResult.errors.join(os.EOL),
      resolution: 'Manually configure the imported auth resource according to the details above',
    });
  }

  if (checkResult.errors && checkResult.errors.length > 0) {
    printer.warn(checkResult.errors.join(os.EOL));
  }

  // If auth is not imported and there were errors, adjust or enable auth configuration
  if (!checkResult.authEnabled || !checkResult.requirementsMet) {
    printer.warn(`Adding ${AmplifyCategories.NOTIFICATIONS} would also add the Auth category to the project if not already added.`);

    await context.amplify.invokePluginMethod(context, 'auth', undefined, 'externalAuthEnable', [
      context,
      AmplifyCategories.NOTIFICATIONS,
      resourceName,
      apiRequirements,
    ]);

    printer.warn('Execute "amplify push" to update the Auth resources in the cloud.');
  }
};

const getIamClient = async (context: $TSContext, action: string | undefined): Promise<$TSAny> => {
  const providerPlugins = context.amplify.getProviderPlugins(context);
  // eslint-disable-next-line import/no-dynamic-require, global-require, @typescript-eslint/no-var-requires
  const provider = require(providerPlugins[providerName]);
  const config = await provider.getConfiguredAWSClientConfig(context, AmplifyCategories.NOTIFICATIONS, action);
  return new IAM({
    ...config,
  });
};

const getPolicyDoc = (context: $TSContext): string => {
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
};

const getPolicyName = (context: $TSContext): string => `${policyNamePrefix}${context.amplify.makeId(8)}`;
