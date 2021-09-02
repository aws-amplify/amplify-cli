import { nspawn as spawn, retry, getCLIPath, getScriptRunnerPath, describeCloudFormationStack } from '..';
import { getBackendAmplifyMeta } from '../utils';

export const deleteProject = async (cwd: string, profileConfig?: any): Promise<void> => {
  // Read the meta from backend otherwise it could fail on non-pushed, just initialized projects
  const { StackName: stackName, Region: region } = getBackendAmplifyMeta(cwd).providers.awscloudformation;
  await retry(
    () => describeCloudFormationStack(stackName, region, profileConfig),
    stack => stack.StackStatus.endsWith('_COMPLETE'),
  );
  return new Promise((resolve, reject) => {
    const noOutputTimeout = 1000 * 60 * 20; // 20 minutes;
    spawn(getScriptRunnerPath(), [getCLIPath(), 'delete'], { cwd, stripColors: true, noOutputTimeout })
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
};
