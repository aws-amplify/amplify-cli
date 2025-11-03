import {
  $TSContext,
  stateManager,
  getPermissionsBoundaryArn,
  setPermissionsBoundaryArn,
  AmplifyError,
  AMPLIFY_DOCS_URL,
} from '@aws-amplify/amplify-cli-core';
import { prompt } from 'inquirer';
import { IAMClient } from '../aws-utils/aws-iam';
import { GetPolicyCommand } from '@aws-sdk/client-iam';

export const configurePermissionsBoundaryForExistingEnv = async (context: $TSContext) => {
  setPermissionsBoundaryArn(await permissionsBoundarySupplier(context));
  context.print.info(
    'Run `amplify push --force` to update IAM permissions boundary if you have no other resource changes.\nRun `amplify push` to deploy IAM permissions boundary alongside other cloud resource changes.',
  );
};

export const configurePermissionsBoundaryForInit = async (context: $TSContext) => {
  const { envName } = context.exeInfo.localEnvInfo; // the new environment name
  if (context?.exeInfo?.isNewProject) {
    // amplify init
    // on init flow, set the permissions boundary if specified in a cmd line arg, but don't prompt for it
    setPermissionsBoundaryArn(
      await permissionsBoundarySupplier(context, { doPrompt: false, envNameSupplier: () => envName }),
      envName,
      context.exeInfo.teamProviderInfo,
    );
  } else {
    // amplify env add
    await rolloverPermissionsBoundaryToNewEnvironment(context);
  }
};

const permissionsBoundarySupplierDefaultOptions = {
  required: false,
  doPrompt: true,
  envNameSupplier: (): string => stateManager.getLocalEnvInfo().envName,
};

/**
 * Supplies a permissions boundary ARN by first checking headless parameters, then falling back to a CLI prompt
 * @param context CLI context object
 * @param options Additional options to control the supplier
 * @returns string, the permissions boundary ARN or an empty string
 */
const permissionsBoundarySupplier = async (
  context: $TSContext,
  options?: Partial<typeof permissionsBoundarySupplierDefaultOptions>,
): Promise<string | undefined> => {
  const { required, doPrompt, envNameSupplier } = { ...permissionsBoundarySupplierDefaultOptions, ...options };
  const headlessPermissionsBoundary = context?.input?.options?.['permissions-boundary'];

  const validate = context.amplify.inputValidation({
    operator: 'regex',
    value: '^(|arn:aws:iam::(\\d{12}|aws):policy/.+)$',
    onErrorMsg: 'Specify a valid IAM Policy ARN',
    required: true,
  });

  if (typeof headlessPermissionsBoundary === 'string') {
    if (validate(headlessPermissionsBoundary)) {
      return headlessPermissionsBoundary;
    }
    context.print.error('The permissions boundary ARN specified is not a valid IAM Policy ARN');
  }

  const isYes = context?.input?.options?.yes;
  if (required && (isYes || !doPrompt)) {
    throw new AmplifyError('InputValidationError', {
      message: 'A permissions boundary ARN must be specified using --permissions-boundary',
      link: `${AMPLIFY_DOCS_URL}/cli/project/permissions-boundary/`,
    });
  }
  if (!doPrompt) {
    // if we got here, the permissions boundary is not required and we can't prompt so return undefined
    return undefined;
  }
  const envName = envNameSupplier();

  const defaultValue = getPermissionsBoundaryArn(envName);
  const hasDefault = typeof defaultValue === 'string' && defaultValue.length > 0;
  const promptSuffix = hasDefault ? ' (leave blank to remove the permissions boundary configuration)' : '';

  const { permissionsBoundaryArn } = await prompt<{ permissionsBoundaryArn: string }>({
    type: 'input',
    name: 'permissionsBoundaryArn',
    message: `Specify an IAM Policy ARN to use as a permissions boundary for all Amplify-generated IAM Roles in the ${envName} environment${promptSuffix}:`,
    default: defaultValue,
    validate,
  });
  return permissionsBoundaryArn;
};

/**
 * This function expects to be called during the env add flow BEFORE the local-env-info file is overwritten with the new env
 * (ie when it still contains info on the previous env)
 * context.exeInfo.localEnvInfo.envName is expected to have the new env name
 */
const rolloverPermissionsBoundaryToNewEnvironment = async (context: $TSContext) => {
  const newEnv = context.exeInfo.localEnvInfo.envName;
  const headlessPermissionsBoundary = await permissionsBoundarySupplier(context, { doPrompt: false, envNameSupplier: () => newEnv });
  // if headless policy specified, apply that and return
  if (typeof headlessPermissionsBoundary === 'string') {
    setPermissionsBoundaryArn(headlessPermissionsBoundary, newEnv, context.exeInfo.teamProviderInfo);
    return;
  }

  const currBoundary = getPermissionsBoundaryArn();
  // if current env doesn't have a permissions boundary, do nothing
  if (!currBoundary) {
    return;
  }

  const currEnv = stateManager.getLocalEnvInfo()?.envName ?? 'current';

  // if existing policy is accessible in new env, apply that one
  if (await isPolicyAccessible(context, currBoundary)) {
    setPermissionsBoundaryArn(currBoundary, newEnv, context.exeInfo.teamProviderInfo);
    context.print.info(
      `Permissions boundary ${currBoundary} from the ${currEnv} environment has automatically been applied to the ${newEnv} environment.\nTo modify this, run \`amplify env update\`.\n`,
    );
    return;
  }
  // if existing policy policy is not accessible in the new environment, prompt for a new one
  context.print.warning(
    `Permissions boundary ${currBoundary} from the ${currEnv} environment cannot be applied to resources the ${newEnv} environment.`,
  );
  setPermissionsBoundaryArn(
    await permissionsBoundarySupplier(context, { required: true, envNameSupplier: () => newEnv }),
    newEnv,
    context.exeInfo.teamProviderInfo,
  );
};

const isPolicyAccessible = async (context: $TSContext, policyArn: string) => {
  const iamClient = await IAMClient.getInstance(context);
  try {
    await iamClient.client.send(new GetPolicyCommand({ PolicyArn: policyArn }));
  } catch (err) {
    // NoSuchEntity error
    if (err?.name.includes('NoSuchEntity')) {
      return false;
    }
    // if it's some other error (such as client credentials don't have getPolicy permissions, or network error)
    // give customer's the benefit of the doubt that the ARN is correct
    return true;
  }
  return true;
};
