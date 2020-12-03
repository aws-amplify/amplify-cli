import { DeployMachineContext, DeploymentMachineOp } from './state-machine';
import * as path from 'path';

export const hasMoreRollback = (context: DeployMachineContext) => {
  return context.currentIndex >= 0;
};

export const hasMoreDeployment = (context: DeployMachineContext) => {
  return context.stacks.length > context.currentIndex;
};

export const stackPollerActivity = (
  stackEventPollFn: (stack: Readonly<DeploymentMachineOp>) => () => void,
  operation: 'deploying' | 'rollingback',
) => {
  return (context: Readonly<DeployMachineContext>) => {
    if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
      const stack = context.stacks[context.currentIndex];
      const step = operation == 'deploying' ? stack.deployment : stack.rollback;

      return stackEventPollFn(step);
    }
    return () => {};
  };
};

export const extractStackInfoFromContext = (
  fn: (stack: Readonly<DeploymentMachineOp>) => Promise<void>,
  operation: 'deploying' | 'rollingback',
): ((context: Readonly<DeployMachineContext>) => Promise<void>) => {
  return (context: DeployMachineContext) => {
    if (context.currentIndex >= 0 && context.currentIndex < context.stacks.length) {
      const stack = context.stacks[context.currentIndex];
      const step = operation == 'deploying' ? stack.deployment : stack.rollback;
      return fn(step);
    }
    return Promise.resolve();
  };
};

export const getBucketKey = (keyOrUrl: string, bucketName: string): string => {
  if (keyOrUrl.startsWith('https://') && keyOrUrl.includes(bucketName)) {
    return keyOrUrl.substring(keyOrUrl.indexOf(bucketName) + bucketName.length + 1);
  }
  return keyOrUrl;
};

export const getHttpUrl = (keyOrUrl: string, bucketName: string): string => {
  return keyOrUrl.startsWith('https://') ? keyOrUrl : `https://s3.amazonaws.com/${path.join(bucketName, keyOrUrl)}`;
};
