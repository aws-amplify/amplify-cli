import {
  $TSContext,
  DeploymentState,
  DeploymentStatus,
  StepStatusParameters,
  DeploymentStepState,
  DeploymentStepStatus,
  IDeploymentStateManager,
  JSONUtilities,
} from 'amplify-cli-core';
import { S3 } from '../aws-utils/aws-s3';
import { ProviderName } from '../constants';

export class DeploymentStateManager implements IDeploymentStateManager {
  private static stateFileName: string = 'deployment-state.json';

  // The direction of advance step, in case of rollback it is reversed.
  private direction: number = 1;
  private currentState: DeploymentState;

  public static createDeploymentStateManager = async (context: $TSContext): Promise<IDeploymentStateManager> => {
    const projectDetails = context.amplify.getProjectDetails();
    const { envName } = context.amplify.getEnvInfo();
    const deploymentBucketName = projectDetails.amplifyMeta.providers
      ? projectDetails.amplifyMeta.providers[ProviderName].DeploymentBucketName
      : projectDetails.teamProviderInfo[envName][ProviderName].DeploymentBucketName;

    const s3 = await S3.getInstance(context);
    const deploymentStateManager = new DeploymentStateManager(s3, deploymentBucketName, envName);

    await deploymentStateManager.loadOrCreateState();

    return deploymentStateManager;
  };

  public static getStatusFromCloud = async (context: $TSContext): Promise<DeploymentState | null> => {
    const deploymentStateManager = await DeploymentStateManager.createDeploymentStateManager(context);

    return deploymentStateManager.getStatus();
  };

  private constructor(private readonly s3: S3, private readonly deploymentBucketName: string, private readonly envName: string) {}

  public startDeployment = async (steps: DeploymentStepState[]): Promise<boolean> => {
    // Before starting a deployment do a reload on the persisted state in the cloud, to minimize the chance
    // of concurrently starting a deployment.
    const persistedState = await this.loadState();

    if (persistedState) {
      if (persistedState.status === DeploymentStatus.DEPLOYING || persistedState.status === DeploymentStatus.ROLLING_BACK) {
        return false;
      }

      // Use the freshly loaded state as current state
      this.currentState = persistedState;
    }

    // if running a deployment after a rollback refresh the currentState direction to 1
    this.direction = 1;

    this.currentState.startedAt = new Date().toISOString();
    this.currentState.finishedAt = undefined;
    this.currentState.currentStepIndex = 0;
    this.currentState.status = DeploymentStatus.DEPLOYING;
    this.currentState.steps = steps;

    this.currentState.steps.forEach(s => {
      s.status = DeploymentStepStatus.WAITING_FOR_DEPLOYMENT;
    });

    await this.saveState();

    return true;
  };

  public failDeployment = async (): Promise<void> => {
    if (this.currentState.status !== DeploymentStatus.ROLLED_BACK && this.currentState.status !== DeploymentStatus.DEPLOYED) {
      this.currentState.finishedAt = new Date().toISOString();
      this.currentState.status = DeploymentStatus.FAILED;

      await this.saveState();
    }
  };

  public updateStatus = async (status: DeploymentStatus): Promise<void> => {
    this.currentState.status = status;
    await this.saveState();
  };

  public updateCurrentStepStatus = async (status: DeploymentStepStatus): Promise<void> => {
    this.getCurrentStep().status = status;
    await this.saveState();
  };

  public startCurrentStep = async (params?: StepStatusParameters): Promise<void> => {
    if (this.direction === 1) {
      if (this.getCurrentStep().status !== DeploymentStepStatus.WAITING_FOR_DEPLOYMENT) {
        throw new Error(`Cannot start step then the current step is in ${this.getCurrentStep().status} status.`);
      }
      const currentStep = this.getCurrentStep();
      currentStep.status = DeploymentStepStatus.DEPLOYING;
      if (params?.previousMetaKey) currentStep.previousMetaKey = params.previousMetaKey;
    } else if (this.direction === -1) {
      if (this.getCurrentStep().status !== DeploymentStepStatus.WAITING_FOR_ROLLBACK) {
        throw new Error(`Cannot start step then the current step is in ${this.getCurrentStep().status} status.`);
      }
      this.getCurrentStep().status = DeploymentStepStatus.ROLLING_BACK;
    }

    await this.saveState();
  };

  public advanceStep = async (): Promise<void> => {
    if (!this.isDeploymentInProgress()) {
      throw new Error(`Cannot advance a deployment when it was not started.`);
    }

    if (this.direction === 1 && this.getCurrentStep().status !== DeploymentStepStatus.DEPLOYING) {
      throw new Error(`Cannot advance step then the current step is in ${this.getCurrentStep().status} status.`);
    } else if (this.direction === -1 && this.getCurrentStep().status !== DeploymentStepStatus.ROLLING_BACK) {
      throw new Error(`Cannot advance step then the current step is in ${this.getCurrentStep().status} status.`);
    }

    // Check if we are finishing the deployment or just advancing a step
    if (this.direction === 1 && this.currentState.currentStepIndex === this.currentState.steps.length - 1) {
      this.getCurrentStep().status = DeploymentStepStatus.DEPLOYED;

      this.currentState.currentStepIndex = 0;
      this.currentState.finishedAt = new Date().toISOString();
      this.currentState.status = DeploymentStatus.DEPLOYED;
    } else if (this.direction === -1 && this.currentState.currentStepIndex === 0) {
      const currentStep = this.getCurrentStep();
      currentStep.status = DeploymentStepStatus.ROLLED_BACK;
      if (currentStep?.previousMetaKey) {
        delete currentStep.previousMetaKey;
      }
      this.currentState.currentStepIndex = 0;
      this.currentState.finishedAt = new Date().toISOString();
      this.currentState.status = DeploymentStatus.ROLLED_BACK;
    } else {
      // Regular advance step
      if (this.direction === 1) {
        this.getCurrentStep().status = DeploymentStepStatus.DEPLOYED;
      } else if (this.direction === -1) {
        const currentStep = this.getCurrentStep();
        currentStep.status = DeploymentStepStatus.ROLLED_BACK;
        if (currentStep?.previousMetaKey) {
          delete currentStep.previousMetaKey;
        }
      }

      this.currentState.currentStepIndex += this.direction;
    }

    await this.saveState();
  };

  public startRollback = async (): Promise<void> => {
    if (!this.isDeploymentInProgress() || this.direction !== 1) {
      throw new Error('To rollback a deployment, the deployment must be in progress and not already rolling back.');
    }

    this.direction = -1;

    for (let i = 0; i <= this.currentState.currentStepIndex; i++) {
      this.currentState.steps[i].status = DeploymentStepStatus.WAITING_FOR_ROLLBACK;
    }

    this.currentState.status = DeploymentStatus.ROLLING_BACK;

    await this.saveState();
  };

  public isDeploymentInProgress = (): boolean =>
    this.currentState.status === DeploymentStatus.DEPLOYING || this.currentState.status === DeploymentStatus.ROLLING_BACK;

  public isDeploymentFinished = (): boolean => this.currentState.finishedAt !== undefined;

  public getStatus = (): DeploymentState | undefined => {
    return this.currentState;
  };

  private loadOrCreateState = async (): Promise<void> => {
    const persistedState = await this.loadState();

    if (persistedState) {
      this.currentState = persistedState;
    } else {
      this.currentState = {
        version: '1',
        startedAt: '',
        finishedAt: undefined,
        status: DeploymentStatus.IDLE,
        currentStepIndex: 0,
        steps: [],
      };
    }
  };

  private loadState = async (): Promise<DeploymentState | undefined> => {
    const stateFileContent = await this.s3.getStringObjectFromBucket(this.deploymentBucketName, DeploymentStateManager.stateFileName);

    if (stateFileContent) {
      return JSONUtilities.parse<DeploymentState>(stateFileContent);
    }
    return undefined;
  };

  private saveState = async (): Promise<void> => {
    await this.s3.uploadFile(
      {
        Key: DeploymentStateManager.stateFileName,
        Body: JSONUtilities.stringify(this.currentState),
      },
      false,
    );
  };

  private getCurrentStep = (): DeploymentStepState => this.currentState.steps[this.currentState.currentStepIndex];
}
