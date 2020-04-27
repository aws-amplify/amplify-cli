import { nspawn as spawn, retry } from 'amplify-e2e-core';
import { getCLIPath, describeCloudFormationStack, getProjectMeta } from '../utils';

export const deleteProject = async (cwd: string, deleteDeploymentBucket: Boolean = true) => {
  const { StackName: stackName, Region: region } = getProjectMeta(cwd).providers.awscloudformation;
  await retry(
    () => describeCloudFormationStack(stackName, region),
    stack => stack.StackStatus.endsWith('_COMPLETE'),
  );
  return new Promise((resolve, reject) => {
    const noOutputTimeout = 10 * 60 * 1000; // 10 minutes
    spawn(getCLIPath(), ['delete'], { cwd, stripColors: true, noOutputTimeout })
      .wait('Are you sure you want to continue?')
      .sendLine('y')
      .sendCarriageReturn()
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
