import {
  $TSContext,
  $TSMeta,
  DeploymentState,
  DeploymentStatus,
  DeploymentStepStatus,
  IDeploymentStateManager,
  JSONUtilities,
} from 'amplify-cli-core';
import { DeploymentOp, DeploymentManager } from '.';
import { S3 } from '../aws-utils/aws-s3';
import { formUserAgentParam } from '../aws-utils/user-agent';
import ora from 'ora';
const spinner = ora('');

const prevDeploymentStatus = [
  DeploymentStepStatus.DEPLOYING,
  DeploymentStepStatus.ROLLING_BACK,
  DeploymentStepStatus.DEPLOYED,
  DeploymentStepStatus.WAITING_FOR_ROLLBACK,
];

const loadDeploymentMeta = async (s3: S3, bucketName: string, metaKey: string): Promise<DeploymentOp> => {
  const metaDeploymentContent = await s3.getStringObjectFromBucket(bucketName, metaKey);
  if (metaDeploymentContent) {
    return JSONUtilities.parse<DeploymentOp>(metaDeploymentContent);
  }
  throw new Error(`Could not load deployment meta for ${metaKey}`);
};

// https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings
const getParentStatePath = (files: string[]) => {
  let A = files.concat().sort();
  let a1 = A[0];
  let a2 = A[A.length - 1];
  let L = a1.length;
  let i = 0;
  while (i < L && a1.charAt(i) === a2.charAt(i)) i++;
  return a1.substring(0, i);
};

export async function run(context: $TSContext, cloudformationMeta: $TSMeta, deploymentStateManager: IDeploymentStateManager) {
  const s3 = await S3.getInstance(context);
  const deploymentBucket = cloudformationMeta.DeploymentBucketName;
  const deploymentStatus: DeploymentState = deploymentStateManager.getStatus();
  const deployedSteps = deploymentStatus.steps.slice(0, deploymentStatus.currentStepIndex + 1);
  const deploymentManager = await DeploymentManager.createInstance(context, deploymentBucket, spinner, {
    userAgent: formUserAgentParam(context, 'iterative-rollback'),
  });
  const rollbackSteps = new Array<DeploymentOp>();
  const stateFiles: string[] = [];
  for (const step of deployedSteps) {
    if (!step.prevMetaKey) {
      context.print.error('Cannot find previous deployment information.');
      return;
    }
    const deploymentMeta = await loadDeploymentMeta(s3, deploymentBucket, step.prevMetaKey);
    if (prevDeploymentStatus.includes(step.status)) {
      rollbackSteps.push(deploymentMeta);
      stateFiles.push(step.prevMetaKey);
    }
  }
  if (rollbackSteps.length > 0) {
    rollbackSteps.forEach(step => {
      deploymentManager.addRollbackStep(step);
    });
    spinner.start('Iterative Rollback in progress');
    await deploymentManager.rollback(deploymentStateManager);
    // delete parent state file
    const stateS3Dir = getParentStatePath(stateFiles);
    await s3.deleteDirectory(deploymentBucket, stateS3Dir);
    spinner.succeed('Finished Rollback');
  }
}
