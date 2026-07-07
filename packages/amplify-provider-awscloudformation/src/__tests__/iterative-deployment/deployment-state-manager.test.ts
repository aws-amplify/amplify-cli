import { DeploymentStatus, DeploymentStepStatus, IDeploymentStateManager } from '@aws-amplify/amplify-cli-core';
import { DeploymentStateManager } from '../../iterative-deployment/deployment-state-manager';
import { S3 } from '../../aws-utils/aws-s3';

jest.mock('@aws-amplify/amplify-cli-core', () => ({
  ...(jest.requireActual('@aws-amplify/amplify-cli-core') as Record<string, unknown>),
  stateManager: {
    getMeta: jest.fn().mockReturnValue({
      providers: {
        awscloudformation: {
          DeploymentBucketName: 'bucket',
        },
      },
    }),
  },
}));

describe('deployment state manager', () => {
  let deploymentStateManager: IDeploymentStateManager;

  let s3Files: Record<string, string> = {};

  const mockContext: any = {
    amplify: {
      getProjectDetails: () => ({
        amplifyMeta: {
          providers: {
            awscloudformation: {
              DeploymentBucketName: 'bucket',
            },
          },
        },
      }),
      getEnvInfo: () => ({
        envName: 'dev',
      }),
    },
  };

  beforeEach(async () => {
    const getInstanceSpy = jest.spyOn(S3, 'getInstance');

    getInstanceSpy.mockReturnValue(
      new Promise((resolve) => {
        resolve({
          // eslint-disable-next-line
          uploadFile: async (s3Params: any, showSpinner: boolean): Promise<string> =>
            new Promise((resolve) => {
              s3Files[s3Params.Key] = s3Params.Body;

              resolve('');
            }),
          // eslint-disable-next-line
          getStringObjectFromBucket: async (bucketName: string, objectKey: string): Promise<string> =>
            new Promise((resolve) => {
              resolve(s3Files[objectKey]);
            }),
        } as unknown as S3);
      }),
    );

    deploymentStateManager = await DeploymentStateManager.createDeploymentStateManager(mockContext);
  });

  afterEach(async () => {
    s3Files = {};
  });

  it('deployment in progress reflected correctly', async () => {
    let isInProgress = deploymentStateManager.isDeploymentInProgress();
    expect(isInProgress).toBe(false);

    const started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);

    isInProgress = deploymentStateManager.isDeploymentInProgress();
    expect(isInProgress).toBe(true);

    await deploymentStateManager.startCurrentStep();

    let currentStatus = deploymentStateManager.getStatus();
    expect(currentStatus.steps[0].status).toBe(DeploymentStepStatus.DEPLOYING);

    await deploymentStateManager.advanceStep();

    currentStatus = deploymentStateManager.getStatus();
    expect(currentStatus.steps[0].status).toBe(DeploymentStepStatus.DEPLOYED);

    isInProgress = deploymentStateManager.isDeploymentInProgress();
    expect(isInProgress).toBe(false);
  });

  it('should not advance forward without starting step', async () => {
    const started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);

    await expect(deploymentStateManager.advanceStep()).rejects.toThrow(
      'Cannot advance step when the current step is in WAITING_FOR_DEPLOYMENT status.',
    );
  });

  it('should not advance backward without starting step', async () => {
    const started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);

    await deploymentStateManager.startRollback();

    await expect(deploymentStateManager.advanceStep()).rejects.toThrow(
      'Cannot advance step when the current step is in WAITING_FOR_ROLLBACK status.',
    );
  });

  it('second start fails if deployment is in progress', async () => {
    let started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);

    started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(false);
  });

  it('second start uses state from cloud', async () => {
    let started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);
  });

  it('no deployment in progress when a deployment already finished previously present', async () => {
    await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    const currentStatus = deploymentStateManager.getStatus();
    expect(currentStatus.status).toBe(DeploymentStatus.DEPLOYED);

    const isInProgress = deploymentStateManager.isDeploymentInProgress();

    expect(isInProgress).toBe(false);
  });

  it('multi step deployment succeeds', async () => {
    const started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    const currentCloudState = await DeploymentStateManager.getStatusFromCloud(mockContext);

    expect(currentCloudState.status).toBe(DeploymentStatus.DEPLOYED);
    expect(currentCloudState.steps.filter((s) => s.status === DeploymentStepStatus.DEPLOYED).length).toBe(3);

    const currentStatus = deploymentStateManager.getStatus();
    const cloudStatus = await DeploymentStateManager.getStatusFromCloud(mockContext);

    expect(currentStatus).toMatchObject(cloudStatus);
  });

  it('multi step deployment with rollback succeeds', async () => {
    const started = await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    expect(started).toBe(true);

    await deploymentStateManager.startCurrentStep();

    await deploymentStateManager.advanceStep();

    await deploymentStateManager.startRollback();

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    const currentCloudState = await DeploymentStateManager.getStatusFromCloud(mockContext);

    expect(currentCloudState.status).toBe(DeploymentStatus.ROLLED_BACK);
    expect(currentCloudState.steps.filter((s) => s.status === DeploymentStepStatus.WAITING_FOR_DEPLOYMENT).length).toBe(1);
    expect(currentCloudState.steps.filter((s) => s.status === DeploymentStepStatus.ROLLED_BACK).length).toBe(2);

    const currentStatus = await deploymentStateManager.getStatus();
    const cloudStatus = await DeploymentStateManager.getStatusFromCloud(mockContext);

    expect(currentStatus).toMatchObject(cloudStatus);
  });

  it('cannot finish deployment twice', async () => {
    await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    await expect(deploymentStateManager.advanceStep()).rejects.toThrow('Cannot advance a deployment when it was not started.');
  });

  it('cannot finish rolled back deployment twice', async () => {
    await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    await deploymentStateManager.startRollback();

    await deploymentStateManager.startCurrentStep();
    await deploymentStateManager.advanceStep();

    await expect(deploymentStateManager.advanceStep()).rejects.toThrow('Cannot advance a deployment when it was not started.');
  });

  it('can set FAILED status on in-progress deployments', async () => {
    await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    await deploymentStateManager.failDeployment();

    const currentStatus = deploymentStateManager.getStatus();

    expect(currentStatus.status).toBe(DeploymentStatus.FAILED);
  });

  it('cannot rollback non-started deployment', async () => {
    await expect(deploymentStateManager.startRollback()).rejects.toThrow(
      'To rollback a deployment, the deployment must be in progress and not already rolling back.',
    );
  });

  it('cannot rollback an already rolled back deployment', async () => {
    await deploymentStateManager.startDeployment([
      {
        status: DeploymentStepStatus.WAITING_FOR_DEPLOYMENT,
      },
    ]);

    await deploymentStateManager.startRollback();

    await expect(deploymentStateManager.startRollback()).rejects.toThrow(
      'To rollback a deployment, the deployment must be in progress and not already rolling back.',
    );
  });
});
