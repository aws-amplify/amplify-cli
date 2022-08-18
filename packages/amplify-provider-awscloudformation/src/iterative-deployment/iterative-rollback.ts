import { $TSAny, $TSContext, $TSMeta, DeploymentState, DeploymentStepStatus, IDeploymentStateManager, JSONUtilities } from 'amplify-cli-core';
import { DeploymentOp, DeploymentManager } from './deployment-manager';
import { S3 } from '../aws-utils/aws-s3';
import { formUserAgentParam } from '../aws-utils/user-agent';

class IterativeRollbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IterativeRollbackError';
    this.stack = undefined;
  }
}

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
  throw new IterativeRollbackError(`Could not load deployment meta for ${metaKey}`);
};

// https://stackoverflow.com/questions/1916218/find-the-longest-common-starting-substring-in-a-set-of-strings
const getParentStatePath = (files: string[]): string | null => {
  if (!files) return null;
  if (files.length < 2) return files[0];
  files.sort();
  let longestFilePath = files[0];
  let smallestFilePath = files[files.length - 1];
  let longestFilePathLength = longestFilePath.length;
  let i = 0;
  while (i < longestFilePathLength && longestFilePath.charAt(i) === smallestFilePath.charAt(i)) i++;
  return longestFilePath.substring(0, i);
};

export const runIterativeRollback = async (
  context: $TSContext,
  cloudformationMeta: $TSMeta,
  deploymentStateManager: IDeploymentStateManager,
  eventMap: $TSAny,
) => {
  const deploymentBucket = cloudformationMeta.DeploymentBucketName;
  const deploymentStatus: DeploymentState = deploymentStateManager.getStatus();
  const deployedSteps = deploymentStatus.steps.slice(0, deploymentStatus.currentStepIndex + 1);

  const s3 = await S3.getInstance(context);
  const deploymentManager = await DeploymentManager.createInstance(context, deploymentBucket, eventMap, {
    userAgent: formUserAgentParam(context, 'iterative-rollback'),
  });

  const rollbackSteps = new Array<DeploymentOp>();
  const stateFiles: string[] = [];
  for (const step of deployedSteps) {
    if (!step.previousMetaKey) {
      throw new IterativeRollbackError(
        `Cannot iteratively rollback as the following step does not contain a previousMetaKey: ${JSON.stringify(step)}`,
      );
    }

    const deploymentMeta = await loadDeploymentMeta(s3, deploymentBucket, step.previousMetaKey);
    if (prevDeploymentStatus.includes(step.status)) {
      rollbackSteps.push(deploymentMeta);
      stateFiles.push(step.previousMetaKey);
    }
  }
  if (rollbackSteps.length > 0) {
    rollbackSteps.forEach(step => {
      deploymentManager.addRollbackStep(step);
    });

    await deploymentManager.rollback(deploymentStateManager);
    // delete parent state file
    const stateS3Dir = getParentStatePath(stateFiles);
    await s3.deleteDirectory(deploymentBucket, stateS3Dir);
  }
};
