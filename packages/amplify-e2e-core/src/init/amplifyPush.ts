/* eslint-disable import/no-cycle */
/* eslint-disable max-depth */
/* eslint-disable max-lines-per-function */
/* eslint-disable prefer-const */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-await */
/* eslint-disable consistent-return */
/* eslint-disable no-continue */
/* eslint-disable max-len */
/* eslint-disable spellcheck/spell-checker */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable func-style */
/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-await-in-loop */
/* eslint-disable prefer-arrow/prefer-arrow-functions */

import { getCLIPath, nspawn as spawn } from '..';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

/**
 * Data structure defined for Layer Push
 */
export type LayerPushSettings = {
  acceptSuggestedLayerVersionConfigurations?: boolean;
  layerDescription?: string;
  migrateLegacyLayer?: boolean;
  usePreviousPermissions?: boolean;
};

export type PushOpts = {
  minify?: boolean;
};

/**
 * Function to test amplify push with verbose status
 */
export const amplifyPush = async (cwd: string, testingWithLatestCodebase = false, opts?: PushOpts): Promise<void> => {
  // Test detailed status
  await spawn(getCLIPath(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait(/.*/)
    .runAsync();
  const pushArgs = ['push', ...(opts?.minify ? ['--minify'] : [])];
  // Test amplify push
  await spawn(getCLIPath(testingWithLatestCodebase), pushArgs, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait('Do you want to generate code for your newly created GraphQL API')
    .sendConfirmNo()
    .wait(/.*/)
    .runAsync();
};

/**
 * Function to test amplify push with verbose status
 */
export const amplifyPushLegacy = async (cwd: string): Promise<void> => {
  // Test detailed status
  await spawn(getCLIPath(false), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS }).wait(/.*/).runAsync();
  // Test amplify push
  await spawn(getCLIPath(false), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait('Do you want to generate code for your newly created GraphQL API')
    .sendConfirmNo()
    .wait(/.*/)
    .runAsync();
};

/**
 * Function to test amplify push with --yes
 */
export const amplifyPushNonInteractive = async (cwd: string, testingWithLatestCodebase = false): Promise<void> => {
  await spawn(getCLIPath(testingWithLatestCodebase), ['push', '--yes'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
  }).runAsync();
};

/**
 * Function to test amplify push with codegen for graphql API
 */
export const amplifyPushGraphQlWithCognitoPrompt = async (cwd: string, testingWithLatestCodebase = false): Promise<void> => {
  // Test detailed status
  await spawn(getCLIPath(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait(/.*/)
    .runAsync();
  // Test amplify push
  await spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(/.*Do you want to use the default authentication and security configuration.*/)
    .sendCarriageReturn()
    .wait(/.*How do you want users to be able to sign in.*/)
    .sendCarriageReturn()
    .wait(/.*Do you want to configure advanced settings.*/)
    .sendCarriageReturn()
    .wait('Do you want to generate code for your newly created GraphQL API')
    .sendConfirmNo()
    .wait(/.*/)
    .runAsync();
};

/**
 * Function to test amplify push with force push flag --force
 */
export const amplifyPushForce = (cwd: string, testingWithLatestCodebase = false): Promise<void> =>
  spawn(getCLIPath(testingWithLatestCodebase), ['push', '--force'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(/.*/)
    .runAsync();

/**
 * * Used to stop an iterative deployment
 * * Waits on the table stack to be complete and for the next stack to update in order to cancel the push
 */
export function cancelIterativeAmplifyPush(
  cwd: string,
  idx: { current: number; max: number },
  testingWithLatestCodebase = false,
): Promise<void> {
  return spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(`Deploying iterative update ${idx.current} of ${idx.max} into`)
    .wait(/.*AWS::AppSync::GraphQLSchema\s*UPDATE_IN_PROGRESS.*/)
    .sendCtrlC()
    .runAsync((err: Error) => err.message === 'Process exited with non zero exit code 130');
}

/**
 * Function to test amplify push without codegen prompt
 */
export const amplifyPushWithoutCodegen = async (
  cwd: string,
  testingWithLatestCodebase = false,
  allowDestructiveUpdates = false,
): Promise<void> => {
  const args = ['push'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  return spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn()
    .runAsync();
};

/**
 * Function to test amplify push with function secrets without codegen prompt
 */
export function amplifyPushSecretsWithoutCodegen(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  const args = ['push'];
  return spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn()
    .wait('Secret configuration detected. Do you wish to store new values in the cloud?')
    .sendConfirmYes()
    .runAsync();
}

/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
export function amplifyPushUpdate(
  cwd: string,
  waitForText?: RegExp,
  testingWithLatestCodebase = false,
  allowDestructiveUpdates = false,
  overridePushTimeoutMS = 0,
  minify?,
): Promise<void> {
  const args = ['push'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  if (minify) {
    args.push('--minify');
  }
  return spawn(getCLIPath(testingWithLatestCodebase), args, {
    cwd,
    stripColors: true,
    noOutputTimeout: overridePushTimeoutMS || pushTimeoutMS,
  })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(waitForText || /.*/)
    .runAsync();
}

/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
export function amplifyPushUpdateLegacy(
  cwd: string,
  waitForText?: RegExp,
  allowDestructiveUpdates = false,
  overridePushTimeoutMS = 0,
): Promise<void> {
  const args = ['push'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  return spawn(getCLIPath(false), args, { cwd, stripColors: true, noOutputTimeout: overridePushTimeoutMS || pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait(waitForText || /.*/)
    .runAsync();
}

/**
 * Function to test amplify push
 */
export const amplifyPushAuth = (cwd: string, testingWithLatestCodebase = false, env?: Record<string, string>): Promise<void> =>
  spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS, env })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(/.*/)
    .runAsync();

/**
 * Function to test amplify push
 */
export const amplifyPushAuthV10 = (cwd: string, testingWithLatestCodebase = false): Promise<void> =>
  spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait(/.*/)
    .runAsync();

/**
 * To be used in migrations tests only
 */
export const amplifyPushAuthV5V6 = (cwd: string): Promise<void> =>
  spawn(getCLIPath(false), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait(/.*/)
    .runAsync();

/**
 * amplify push command for pushing functions
 * @param cwd : current working directory
 * @param testingWithLatestCode : boolean flag
 * @returns void
 */
export const amplifyPushFunction = async (cwd: string, testingWithLatestCode = false): Promise<void> => {
  const chain = spawn(getCLIPath(testingWithLatestCode), ['push', 'function'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendCarriageReturn();
  return chain.runAsync();
};

/**
 * amplify push command for pushing amplify category resources
 */
export const amplifyPushCategoryWithYesFlag = async (
  cwd: string,
  category: string,
  changesDetected: boolean,
  testingWithLatestCode = false,
): Promise<void> => {
  const chain = spawn(getCLIPath(testingWithLatestCode), ['push', `${category}`], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
  });
  if (changesDetected) {
    chain.wait('Are you sure you want to continue?').sendCarriageReturn();
  }
  return chain.runAsync();
};

/**
 * Function to test amplify push with allowDestructiveUpdates flag and when dependent function is removed from schema.graphql
 */
export function amplifyPushUpdateForDependentModel(
  cwd: string,
  testingWithLatestCodebase = false,
  allowDestructiveUpdates = false,
): Promise<void> {
  const args = ['push'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  return spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .wait(/.*/)
    .wait('Do you want to remove the GraphQL model access on these affected functions?')
    .sendConfirmYes()
    .wait(/.*/)
    .runAsync();
}

/**
 * Function to test amplify push when deploying a layer
 * * this function expects a single layer's content to be modified
 */
export const amplifyPushLayer = (cwd: string, settings: LayerPushSettings, testingWithLatestCodebase = false): Promise<void> => {
  const defaultSettings: LayerPushSettings = {
    acceptSuggestedLayerVersionConfigurations: true,
    migrateLegacyLayer: false,
    usePreviousPermissions: true,
  };

  const effectiveSettings = {
    ...defaultSettings,
    ...settings,
  };

  const chain = spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('Are you sure you want to continue?')
    .sendYes();

  if (settings.migrateLegacyLayer === true) {
    chain
      .wait('Amplify updated the way Lambda layers work to better support team workflows and additional features.')
      .wait('Continue?')
      .sendConfirmYes();
  }

  chain.wait('Suggested configuration for new layer versions:').wait('Accept the suggested layer version configurations?');

  if (effectiveSettings.acceptSuggestedLayerVersionConfigurations === true) {
    chain.sendConfirmYes();
  } else {
    chain.sendConfirmNo();

    chain.wait('What permissions do you want to grant to this new layer version');

    if (effectiveSettings.usePreviousPermissions === true) {
      chain.sendCarriageReturn(); // The same permission as the latest layer version
    } else {
      chain.sendKeyDown().sendCarriageReturn(); // Only accessible by the current account. You can always edit this later with: amplify update function
    }

    // Description prompt
    chain.wait('Description');

    if (effectiveSettings.layerDescription) {
      chain.sendLine(effectiveSettings.layerDescription);
    } else {
      // Accept default description
      chain.sendCarriageReturn();
    }
  }

  return chain.runAsync();
};

/**
 * Function to test amplify push with iterativeRollback flag option
 */
export const amplifyPushIterativeRollback = (cwd: string, testingWithLatestCodebase = false) =>
  spawn(getCLIPath(testingWithLatestCodebase), ['push', '--iterative-rollback'], { cwd, stripColors: true })
    .wait('Are you sure you want to continue?')
    .sendYes()
    .runAsync();

/**
 * Function to test amplify push with missing environment variable
 */
export const amplifyPushMissingEnvVar = (cwd: string, newEnvVarValue: string) =>
  spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
    .wait('Enter a value for')
    .sendLine(newEnvVarValue)
    .wait('Are you sure you want to continue?')
    .sendYes()
    .runAsync();

/**
 * Function to test amplify push with missing function secrets
 */
export const amplifyPushMissingFuncSecret = (cwd: string, newSecretValue: string) =>
  spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
    .wait('does not have a value in this environment. Specify one now:')
    .sendLine(newSecretValue)
    .wait('Are you sure you want to continue?')
    .sendYes()
    .runAsync();

/**
 * Function to test amplify push with no changes in the resources
 */
export const amplifyPushWithNoChanges = (cwd: string, testingWithLatestCodebase = false): Promise<void> =>
  spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait('No changes detected')
    .runAsync();

/**
 * Function to test amplify push with destructive updates on the API models
 */
export const amplifyPushDestructiveApiUpdate = (cwd: string, includeForce: boolean) => {
  const args = ['push', '--yes'];
  if (includeForce) {
    args.push('--force');
  }
  const chain = spawn(getCLIPath(), args, { cwd, stripColors: true });
  if (includeForce) {
    return chain.runAsync();
  } else {
    chain.wait('If this is intended, rerun the command with'); // in this case, we expect the CLI to error out
    return chain.runAsync((err: Error) => !!err);
  }
};

/**
 * Function to test amplify push with overrides functionality
 */
export const amplifyPushOverride = async (
  cwd: string,
  testingWithLatestCodebase = false,
  env: Record<string, string> = {},
): Promise<void> => {
  // Test detailed status
  await spawn(getCLIPath(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
    .wait(/.*/)
    .runAsync();

  // Test amplify push
  await spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS, env })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait(/.*/)
    .runAsync();
};
