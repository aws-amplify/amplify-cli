import * as helper from '../../iterative-deployment/helpers';
import { DeployMachineContext, DeploymentMachineOp } from '../../iterative-deployment/state-machine';
describe('deployment helpers', () => {
  const baseDeploymentOp: DeploymentMachineOp = {
    parameters: {
      deploying: 'true',
    },
    region: 'us-east-2',
    stackName: 'my-stack',
    stackTemplatePath: 'stackTemplatePath',
    stackTemplateUrl: 'stackTemplateUrl',
    tableNames: ['table1'],
    capabilities: [],
  };

  const deploymentContext: DeployMachineContext = {
    currentIndex: -1,
    deploymentBucket: 'my-bucket',
    region: 'us-east-2',
    stacks: [
      {
        deployment: {
          ...baseDeploymentOp,
        },
        rollback: {
          ...baseDeploymentOp,
          parameters: { rollingBack: 'true' },
        },
      },
    ],
  };

  describe('hasMoreDeployment', () => {
    it('should return true when currentIndex is smaller than deployment steps', () => {
      const context: DeployMachineContext = {
        ...deploymentContext,
        currentIndex: -1,
      };
      expect(helper.hasMoreDeployment(context)).toBeTruthy();
    });

    it('should return false when currentIndex is bigger than deployment steps', () => {
      const context: DeployMachineContext = {
        ...deploymentContext,
        currentIndex: 1,
      };
      expect(helper.hasMoreDeployment(context)).toBeFalsy();
    });
  });

  describe('hasMoreRollback', () => {
    it('should return true when currentIndex is greater than -1', () => {
      const context: DeployMachineContext = {
        ...deploymentContext,
        currentIndex: 1,
      };
      expect(helper.hasMoreRollback(context)).toBeTruthy();
    });

    it('should return false when currentIndex is smaller than 0', () => {
      const context: DeployMachineContext = {
        ...deploymentContext,
        currentIndex: -1,
      };
      expect(helper.hasMoreRollback(context)).toBeFalsy();
    });
  });

  describe('extractStackInfoFromContext', () => {
    let deployFn;
    beforeEach(() => {
      jest.restoreAllMocks();
      deployFn = jest.fn();
    });
    describe('deploy', () => {
      it('should extract deploy section when the deploying', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 0,
        };
        helper.extractStackInfoFromContext(deployFn, 'deploying')(context);
        expect(deployFn).toHaveBeenCalledWith(context.stacks[0].deployment);
      });
      it('should be an no-op if the current index is greater than the number of stacks', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 2,
        };
        helper.extractStackInfoFromContext(deployFn, 'deploying')(context);
        expect(deployFn).not.toHaveBeenCalled();
      });

      it('should be an no-op if the current index is less than 0', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: -1,
        };
        helper.extractStackInfoFromContext(deployFn, 'deploying')(context);
        expect(deployFn).not.toHaveBeenCalled();
      });
    });
    describe('rollback', () => {
      it('should extract deploy section when the deploying', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 0,
        };
        helper.extractStackInfoFromContext(deployFn, 'rollingback')(context);
        expect(deployFn).toHaveBeenCalledWith(context.stacks[0].rollback);
      });
      it('should be an no-op if the current index is greater than the number of stacks', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 2,
        };
        helper.extractStackInfoFromContext(deployFn, 'rollingback')(context);
        expect(deployFn).not.toHaveBeenCalled();
      });

      it('should be an no-op if the current index is less than 0', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: -1,
        };
        helper.extractStackInfoFromContext(deployFn, 'rollingback')(context);
        expect(deployFn).not.toHaveBeenCalled();
      });
    });
  });

  describe('stackPollerActivity', () => {
    let stackPoller;
    beforeEach(() => {
      jest.restoreAllMocks();
      stackPoller = jest.fn().mockImplementation(() => jest.fn);
    });
    describe('deploy', () => {
      it('should extract deploy section when the deploying', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 0,
        };
        helper.stackPollerActivity(stackPoller, 'deploying')(context);
        expect(stackPoller).toHaveBeenCalledWith(context.stacks[0].deployment);
      });
      it('should be an no-op if the current index is greater than the number of stacks', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 2,
        };
        helper.stackPollerActivity(stackPoller, 'deploying')(context);
        expect(stackPoller).not.toHaveBeenCalled();
      });

      it('should be an no-op if the current index is less than 0', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: -1,
        };
        helper.stackPollerActivity(stackPoller, 'deploying')(context);
        expect(stackPoller).not.toHaveBeenCalled();
      });
    });
    describe('rollback', () => {
      it('should extract deploy section when the deploying', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 0,
        };
        helper.stackPollerActivity(stackPoller, 'rollingback')(context);
        expect(stackPoller).toHaveBeenCalledWith(context.stacks[0].rollback);
      });
      it('should be an no-op if the current index is greater than the number of stacks', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: 2,
        };
        helper.stackPollerActivity(stackPoller, 'rollingback')(context);
        expect(stackPoller).not.toHaveBeenCalled();
      });

      it('should be an no-op if the current index is less than 0', () => {
        const context: DeployMachineContext = {
          ...deploymentContext,
          currentIndex: -1,
        };
        helper.stackPollerActivity(stackPoller, 'rollingback')(context);
        expect(stackPoller).not.toHaveBeenCalled();
      });
    });
  });

  describe('getBucketKey', () => {
    const bucketName = 'my-bucket';
    it('should return bucket key from url', () => {
      expect(helper.getBucketKey(`https://s3.amazon.com/${bucketName}/my-key`, bucketName)).toEqual('my-key');
    });
    it('should return bucket key key', () => {
      expect(helper.getBucketKey(`my-key`, bucketName)).toEqual('my-key');
    });
  });

  describe('getHttpUrl', () => {
    const bucketName = 'my-bucket';
    it('should return bucket key from url', () => {
      expect(helper.getHttpUrl(`https://s3.amazonaws.com/${bucketName}/my-key`, bucketName)).toEqual(
        `https://s3.amazonaws.com/${bucketName}/my-key`,
      );
    });
    it('should return bucket key key', () => {
      expect(helper.getHttpUrl(`my-key`, bucketName)).toEqual(`https://s3.amazonaws.com/${bucketName}/my-key`);
    });
  });
});
