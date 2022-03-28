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

/**
 * Function to test amplify push with verbose status
 */
export function amplifyPush(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Test detailed status
    spawn(getCLIPath(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait(/.*/)
      .run((err: Error) => {
        if (err) {
          reject(err);
        }
      });
    // Test amplify push
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait('Do you want to generate code for your newly created GraphQL API')
      .sendConfirmNo()
      .wait(/.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push with codegen for graphql API
 */
export function amplifyPushGraphQlWithCognitoPrompt(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Test detailed status
    spawn(getCLIPath(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait(/.*/)
      .run((err: Error) => {
        if (err) {
          reject(err);
        }
      });
    // Test amplify push
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(/.*Do you want to use the default authentication and security configuration.*/)
      .sendCarriageReturn()
      .wait(/.*How do you want users to be able to sign in.*/)
      .sendCarriageReturn()
      .wait(/.*Do you want to configure advanced settings.*/)
      .sendCarriageReturn()
      .wait('Do you want to generate code for your newly created GraphQL API')
      .sendConfirmNo()
      .wait(/.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push with force push flag --force
 */
export function amplifyPushForce(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push', '--force'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(/.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push with --force and --yes flag
 */
export function amplifyPushForceWithYesFlag(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return spawn(getCLIPath(testingWithLatestCodebase), ['push', '--force', '--yes'], {
    cwd,
    stripColors: true,
    noOutputTimeout: pushTimeoutMS,
  }).runAsync();
}

/**
 * * Used to stop an iterative deployment
 * * Waits on the table stack to be complete and for the next stack to update in order to cancel the push
 */
export function cancelIterativeAmplifyPush(
  cwd: string,
  idx: { current: number; max: number },
  testingWithLatestCodebase = false,
): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(`Deploying (${idx.current} of ${idx.max})`)
      .wait(/.*UPDATE_IN_PROGRESS GraphQLSchema*/)
      .sendCtrlC()
      .run((err: Error) => {
        if (err && !/Killed the process as no output receive for/.test(err.message)) {
          reject(err);
        } else {
          resolve();
        }
      });
  });
}

/**
 * Function to test amplify push without codegen prompt
 */
export function amplifyPushWithoutCodegen(
  cwd: string,
  testingWithLatestCodebase = false,
  allowDestructiveUpdates = false,
): Promise<void> {
  const args = ['push'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendCarriageReturn()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push with function secrets without codegen prompt
 */
export function amplifyPushSecretsWithoutCodegen(
  cwd: string,
  testingWithLatestCodebase = false,
): Promise<void> {
  const args = ['push'];
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendCarriageReturn()
      .wait('Secret configuration detected. Do you wish to store new values in the cloud?')
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push with allowDestructiveUpdates flag option
 */
export function amplifyPushUpdate(
  cwd: string,
  waitForText?: RegExp,
  testingWithLatestCodebase = false,
  allowDestructiveUpdates = false,
): Promise<void> {
  const args = ['push'];
  if (allowDestructiveUpdates) {
    args.push('--allow-destructive-graphql-schema-updates');
  }
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(waitForText || /.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push
 */
export function amplifyPushAuth(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(/.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

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
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), args, { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(/.*/)
      .wait('Do you want to remove the GraphQL model access on these affected functions?')
      .sendConfirmYes()
      .wait(/.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push when deploying a layer
 * * this function expects a single layer's content to be modified
 */
export function amplifyPushLayer(cwd: string, settings: LayerPushSettings, testingWithLatestCodebase = false): Promise<void> {
  const defaultSettings: LayerPushSettings = {
    acceptSuggestedLayerVersionConfigurations: true,
    migrateLegacyLayer: false,
    usePreviousPermissions: true,
  };

  const effectiveSettings = {
    ...defaultSettings,
    ...settings,
  };

  return new Promise((resolve, reject) => {
    const chain = spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes();

    if (settings.migrateLegacyLayer === true) {
      chain
        .wait('⚠️  Amplify updated the way Lambda layers work to better support team workflows and additional features.')
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

    chain.run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
  });
}

/**
 * Function to test amplify push with iterativeRollback flag option
 */
export function amplifyPushIterativeRollback(cwd: string, testingWithLatestCodebase = false) {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push', '--iterative-rollback'], { cwd, stripColors: true })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .run((err: Error) => {
        if (!err) {
          resolve({});
        } else {
          reject(err);
        }
      });
  });
}

/**
 * Function to test amplify push with missing environment variable
 */
export function amplifyPushMissingEnvVar(cwd: string, newEnvVarValue: string) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
      .wait('Enter the missing environment variable value of')
      .sendLine(newEnvVarValue)
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .run(err => (err ? reject(err) : resolve()));
  });
}

/**
 * Function to test amplify push with missing function secrets
 */
export function amplifyPushMissingFuncSecret(cwd: string, newSecretValue: string) {
  return new Promise<void>((resolve, reject) => {
    spawn(getCLIPath(), ['push'], { cwd, stripColors: true })
      .wait('does not have a value in this environment. Specify one now:')
      .sendLine(newSecretValue)
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .run(err => (err ? reject(err) : resolve()));
  });
}

/**
 * Function to test amplify push with no changes in the resources
 */
export function amplifyPushWithNoChanges(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('No changes detected')
      .run((err: Error) => (err ? reject(err) : resolve()));
  });
}

/**
 * Function to test amplify push with destructive updates on the API models
 */
export function amplifyPushDestructiveApiUpdate(cwd: string, includeForce: boolean) {
  return new Promise<void>((resolve, reject) => {
    const args = ['push', '--yes'];
    if (includeForce) {
      args.push('--force');
    }
    const chain = spawn(getCLIPath(), args, { cwd, stripColors: true });
    if (includeForce) {
      chain.wait('All resources are updated in the cloud').run(err => (err ? reject(err) : resolve()));
    } else {
      chain.wait('If this is intended, rerun the command with').run(err => (err ? resolve(err) : reject())); // in this case, we expect the CLI to error out
    }
  });
}

/**
 * Function to test amplify push with overrides functionality
 */
export function amplifyPushOverride(cwd: string, testingWithLatestCodebase = false): Promise<void> {
  return new Promise((resolve, reject) => {
    // Test detailed status
    spawn(getCLIPath(testingWithLatestCodebase), ['status', '-v'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait(/.*/)
      .run((err: Error) => {
        if (err) {
          reject(err);
        }
      });
    // Test amplify push
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait(/.*/)
      .run((err: Error) => {
        if (!err) {
          resolve();
        } else {
          reject(err);
        }
      });
  });
}
