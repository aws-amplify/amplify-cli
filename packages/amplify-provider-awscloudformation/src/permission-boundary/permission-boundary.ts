import { $TSContext, stateManager, getPermissionBoundaryArn, setPermissionBoundaryArn } from 'amplify-cli-core';
import { prompt } from 'inquirer';
import { getInstance as getIAMClient } from '../aws-utils/aws-iam';
import { loadConfiguration } from '../configuration-manager';

export const permissionBoundaryPrompt = async (context: $TSContext): Promise<string> => {
  const { envName } = stateManager.getLocalEnvInfo();
  const { permissionBoundaryArn } = await prompt<{ permissionBoundaryArn: string }>({
    type: 'input',
    name: 'permissionBoundaryArn',
    message: `Specify an IAM Policy ARN to use as a Permission Boundary for all IAM Roles in the ${envName} environment (leave blank to remove the Permission Boundary configuration):`,
    default: getPermissionBoundaryArn(),
    validate: context.amplify.inputValidation({
      operator: 'regex',
      value: '^(|arn:aws:iam::(\\d{12}|aws):policy/.+)$',
      onErrorMsg: 'Specify a valid IAM Policy ARN',
      required: false,
    }),
  });
  return permissionBoundaryArn;
};

/**
 * This function expects to be called during the env add flow BEFORE the local-env-info file is overwritten with the new env
 * (ie when it still contains info on the previous env)
 * context.exeInfo.localEnvInfo.envName is expected to have the new env name
 */
export const rolloverPermissionBoundaryToNewEnvironment = async (context: $TSContext) => {
  const newEnv = context.exeInfo.localEnvInfo.envName;
  const currBoundary = getPermissionBoundaryArn();
  if (!currBoundary) {
    return; // if current env doesn't have a permission boundary, don't do anything
  }
  if (await isPolicyAccessible(context, currBoundary)) {
    setPermissionBoundaryArn(currBoundary, newEnv);
    context.print.info(
      `Permission Boundary ${currBoundary} has automatically been applied to this environment. To modify this, run \`amplify env update\`.`,
    );
    return;
  }
  // previous policy is not accessible in the new environment
  context.print.warning(`Permission Boundary ${currBoundary} cannot be applied to resources in this environment.`);
  setPermissionBoundaryArn(await permissionBoundaryPrompt(context), newEnv);
};

const isPolicyAccessible = async (context: $TSContext, policyArn: string) => {
  const iamClient = await getIAMClient(() => loadConfiguration(context));
  try {
    await iamClient.getPolicy({ PolicyArn: policyArn }).promise();
  } catch (err) {
    // if there's an error, then the policy wasn't accessible
    return false;
  }
  return true;
};
