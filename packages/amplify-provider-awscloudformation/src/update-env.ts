import { $TSContext, getPermissionBoundaryArn, setPermissionBoundaryArn, stateManager } from 'amplify-cli-core';
import { prompt } from 'inquirer';

export type UpdateEnvRequest = {
  env: string;
};

export const updateEnv = async (context: $TSContext) => {
  await updatePermissionBoundaryArn(context);
};

const updatePermissionBoundaryArn = async (context: $TSContext) => {
  const { envName } = stateManager.getLocalEnvInfo();
  const { permissionBoundaryArn } = await prompt({
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
  setPermissionBoundaryArn(permissionBoundaryArn);
};
