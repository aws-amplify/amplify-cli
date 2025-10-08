/* eslint-disable import/no-cycle */
import { nspawn as spawn, retry, getCLIPath, describeCloudFormationStack } from '..';
import { getBackendAmplifyMeta } from '../utils';
import { $TSAny } from '@aws-amplify/amplify-cli-core';

/**
 * Runs `amplify delete`
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteProject = async (
  cwd: string,
  profileConfig?: $TSAny,
  usingLatestCodebase = false,
  noOutputTimeout: number = 1000 * 60 * 20,
): Promise<void> => {
  // Read the meta from backend otherwise it could fail on non-pushed, just initialized projects
  try {
    const { StackName: stackName, Region: region } = getBackendAmplifyMeta(cwd).providers.awscloudformation;
    await retry(
      () => describeCloudFormationStack(stackName, region, profileConfig),
      (stack) => stack.StackStatus.endsWith('_COMPLETE') || stack.StackStatus.endsWith('_FAILED'),
      { timeoutMS: 1000 * 60 * 15 },
      (stack) => stack.StackStatus.includes('_IN_PROGRESS'), // Treat stuck in-progress states as failed
    );

    await spawn(getCLIPath(usingLatestCodebase), ['delete'], { cwd, stripColors: true, noOutputTimeout })
      .wait('Are you sure you want to continue?')
      .sendYes()
      .wait('Project deleted locally.')
      .runAsync();
  } catch (e) {
    console.log('Error on deleting project at:', cwd);
  }
};
