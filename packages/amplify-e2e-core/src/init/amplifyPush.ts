import { getCLIPath, nspawn as spawn } from '..';

const pushTimeoutMS = 1000 * 60 * 20; // 20 minutes;

export type LayerPushSettings = {
  acceptSuggestedLayerVersionConfigurations?: boolean;
  layerDescription?: string;
  migrateLegacyLayer?: boolean;
  usePreviousPermissions?: boolean;
};

export function amplifyPush(cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
      .wait('Are you sure you want to continue?')
      .sendConfirmYes()
      .wait('Do you want to generate code for your newly created GraphQL API')
      .sendLine('n')
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

export function amplifyPushForce(cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> {
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
 *
 * @param cwd
 * @param stackIdx
 * @param testingWithLatestCodebase
 * @returns
 * Used to stop an iterative deployment
 * Waits on the table stack to be complete and for the next stack to update in order to cancel the push
 */
export function cancelIterativeAmplifyPush(
  cwd: string,
  idx: { current: number; max: number },
  testingWithLatestCodebase: boolean = false,
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

export function amplifyPushWithoutCodegen(cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
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

export function amplifyPushUpdate(cwd: string, waitForText?: RegExp, testingWithLatestCodebase: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
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

export function amplifyPushAuth(cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> {
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

export function amplifyPushUpdateForDependentModel(cwd: string, testingWithLatestCodebase: boolean = false): Promise<void> {
  return new Promise((resolve, reject) => {
    spawn(getCLIPath(testingWithLatestCodebase), ['push'], { cwd, stripColors: true, noOutputTimeout: pushTimeoutMS })
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

// this function expects a single layer's content to be modified
export function amplifyPushLayer(cwd: string, settings: LayerPushSettings, testingWithLatestCodebase: boolean = false): Promise<void> {
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

export function amplifyPushIterativeRollback(cwd: string, testingWithLatestCodebase: boolean = false) {
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
