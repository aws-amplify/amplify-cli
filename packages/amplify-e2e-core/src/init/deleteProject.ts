/* eslint-disable import/no-cycle */
import { nspawn as spawn, retry, getCLIPath, describeCloudFormationStack } from '..';
import { getBackendAmplifyMeta } from '../utils';

/**
 * Runs `amplify delete`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteProject = async (cwd: string, profileConfig?: any, usingLatestCodebase = false): Promise<void> => {
  // Read the meta from backend otherwise it could fail on non-pushed, just initialized projects
  try {
    const { StackName: stackName, Region: region } = getBackendAmplifyMeta(cwd).providers.awscloudformation;
    await retry(
      () => describeCloudFormationStack(stackName, region, profileConfig),
      (stack) => stack.StackStatus.endsWith('_COMPLETE') || stack.StackStatus.endsWith('_FAILED'),
    );

    const noOutputTimeout = 1000 * 60 * 20; // 20 minutes;
    await spawn(getCLIPath(usingLatestCodebase), ['delete'], { cwd, stripColors: true, noOutputTimeout })
      .wait('Are you sure you want to continue?')
      .sendYes()
      .wait('Project deleted locally.')
      .runAsync();
  } catch (e) {
    console.log('Error on deleting project at:', cwd);
  }
};

export const amplifyDeleteWithLongerTimeout = (cwd: string, usingLatestCodebase = false): Promise<void> => new Promise((resolve, reject) => {
  const noOutputTimeout = 1000 * 60 * 30; // 30 minutes;
  spawn(getCLIPath(usingLatestCodebase), ['delete'], { cwd, stripColors: true, noOutputTimeout })
    .wait('Are you sure you want to continue?')
    .sendConfirmYes()
    .wait('Project deleted locally.')
    .run((err: Error) => {
      if (!err) {
        resolve();
      } else {
        reject(err);
      }
    });
});
