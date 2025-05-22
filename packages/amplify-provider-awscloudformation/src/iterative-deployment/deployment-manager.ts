import { $TSContext, AmplifyError, AmplifyFault, IDeploymentStateManager } from '@aws-amplify/amplify-cli-core';
import { AmplifySpinner, printer as promptsPrinter } from '@aws-amplify/amplify-prompts';
import assert from 'assert';
import * as aws from 'aws-sdk';
import { ConfigurationOptions } from 'aws-sdk/lib/config-base';
import throttle from 'lodash.throttle';
import { interpret } from 'xstate';
import { getBucketKey, getHttpUrl } from './helpers';
import { IStackProgressPrinter, StackEventMonitor } from './stack-event-monitor';
import {
  createDeploymentMachine,
  createRollbackDeploymentMachine,
  DeployMachineContext,
  DeploymentMachineOp,
  DeploymentMachineStep,
  StateMachineError,
  StateMachineHelperFunctions,
} from './state-machine';
import { loadConfiguration } from '../configuration-manager';
import { fileLogger, Logger } from '../utils/aws-logger';
import { EventMap } from '../utils/progress-bar-helpers';
import { StackProgressPrinter } from './stack-progress-printer';
import { proxyAgent } from '../aws-utils/aws-globals';

interface DeploymentManagerOptions {
  throttleDelay?: number;
  eventPollingDelay?: number;
  userAgent?: string;
}

type SpinnerMessageByState = {
  [state: string]: { machine: string; message: string };
};

const deploySpinnerMessages: SpinnerMessageByState = {
  idle: { machine: 'deploy', message: `Starting deployment.` },
  'deploy.waitForTablesToBeReady': { machine: 'deploy', message: `Waiting for DynamoDB indices to be ready.` },
};

const rollbackSpinnerMessages: SpinnerMessageByState = {
  idle: { machine: 'rollback', message: `Starting rollback.` },
  preRollback: { machine: 'rollback', message: `Waiting for previous deployment to finish.` },
  'rollback.waitForTablesToBeReady': { machine: 'rollback', message: `Waiting for DynamoDB indices to be ready.` },
};

/**
 * Deployment error class
 * TODO conform to new error handling mechanism
 */
export class DeploymentError extends Error {
  constructor(errors: StateMachineError[]) {
    super('There was an error while deploying changes.');
    this.name = `DeploymentError`;
    const stackTrace = [];
    for (const err of errors) {
      stackTrace.push(`Index: ${err.currentIndex} State: ${err.stateValue} Message: ${err.error.message}`);
    }
    this.message = JSON.stringify(stackTrace);
  }
}

/**
 * Deployment operation type
 */
export type DeploymentOp = Omit<DeploymentMachineOp, 'region' | 'stackTemplatePath' | 'stackTemplateUrl'> & {
  stackTemplatePathOrUrl: string;
};

/**
 * Deployment step type
 */
export type DeploymentStep = {
  deployment: DeploymentOp;
  rollback: DeploymentOp;
};

/**
 * DeploymentManager class
 */
export class DeploymentManager {
  /**
   * Helper method to get an instance of the Deployment manager with the right credentials
   */
  public static createInstance = async (
    context: $TSContext,
    deploymentBucket: string,
    eventMap: EventMap,
    options?: DeploymentManagerOptions,
  ): Promise<DeploymentManager> => {
    try {
      const cred = await loadConfiguration(context);
      // this is the "general" config level case, aws sdk will resolve creds and region from env variables etc.
      const region = cred?.region ?? new aws.S3().config.region;
      return new DeploymentManager(cred, region, deploymentBucket, eventMap, options);
    } catch (e) {
      throw new AmplifyError(
        'DeploymentError',
        {
          message: 'Could not load configuration',
        },
        e,
      );
    }
  };

  private deployment: DeploymentMachineStep[] = [];
  private options: Required<DeploymentManagerOptions>;
  private cfnClient: aws.CloudFormation;
  private s3Client: aws.S3;
  private ddbClient: aws.DynamoDB;
  private deploymentStateManager?: IDeploymentStateManager;
  private logger: Logger;
  private printer: IStackProgressPrinter;
  private spinner: AmplifySpinner;

  private constructor(
    creds: ConfigurationOptions,
    private region: string,
    private deploymentBucket: string,
    private eventMap: EventMap,
    options: DeploymentManagerOptions = {},
  ) {
    this.options = {
      throttleDelay: 1_000,
      eventPollingDelay: 1_000,
      userAgent: undefined,
      ...options,
    };
    this.eventMap = eventMap;
    this.s3Client = new aws.S3(creds);
    this.cfnClient = new aws.CloudFormation({
      ...creds,
      maxRetries: 10,
      customUserAgent: this.options.userAgent,
      httpOptions: { agent: proxyAgent() },
    });
    this.ddbClient = new aws.DynamoDB({ ...creds, region, maxRetries: 10, httpOptions: { agent: proxyAgent() } });
    this.logger = fileLogger('deployment-manager');
    this.printer = new StackProgressPrinter(eventMap);
    this.spinner = new AmplifySpinner();
  }

  public deploy = async (deploymentStateManager: IDeploymentStateManager): Promise<void> => {
    this.deploymentStateManager = deploymentStateManager;

    // sanity check before deployment
    const deploymentTemplates = this.deployment.reduce<Set<string>>((acc, step) => {
      acc.add(step.deployment.stackTemplatePath);
      acc.add(step.rollback.stackTemplatePath);
      return acc;
    }, new Set());
    await Promise.all(Array.from(deploymentTemplates.values()).map((path) => this.ensureTemplateExists(path)));

    const fns: StateMachineHelperFunctions = {
      deployFn: this.doDeploy,
      deploymentWaitFn: this.waitForDeployment,
      rollbackFn: this.rollBackStack,
      tableReadyWaitFn: this.waitForIndices,
      rollbackWaitFn: this.waitForDeployment,
      stackEventPollFn: this.stackPollFn,
      startRollbackFn: this.startRollBackFn,
    };

    const machine = createDeploymentMachine(
      {
        currentIndex: -1,
        deploymentBucket: this.deploymentBucket,
        region: this.region,
        stacks: this.deployment,
      },
      fns,
    );

    let maxDeployed = 0;

    return new Promise((resolve, reject) => {
      const service = interpret(machine)
        .onTransition((state) => {
          if (state.changed) {
            maxDeployed = Math.max(maxDeployed, state.context.currentIndex + 1);

            const deploySpinnerState = Object.keys(deploySpinnerMessages).find((key) => state.matches(key));
            if (deploySpinnerState) {
              const deploySpinnerMessage = deploySpinnerMessages[deploySpinnerState];
              this.logger(deploySpinnerMessage.machine, [{ spinner: deploySpinnerMessage.message }])();
              if (!this.printer || (this.printer && !this.printer.isRunning())) {
                this.spinner.start(deploySpinnerMessage.message);
              }
            } else if (state.matches('deployed')) {
              this.updateTerminalOnEventCompletion(`Deployed (${maxDeployed - 1} of ${state.context.stacks.length})`);
              this.logger('DeploymentManager', [{ spinner: 'Deployed' }]);
              this.resetPrinter();
            } else if (state.matches('deploy') || state.matches('rollback')) {
              this.spinner.stop();
              const { currentIndex } = state.context;
              const message = state.matches('deploy')
                ? `Deploying (${maxDeployed} of ${state.context.stacks.length})`
                : `Rolling back (${maxDeployed - currentIndex} of ${maxDeployed})`;
              this.logger('deploy', [{ spinner: message }])();
              this.printer.updateIndexInHeader(maxDeployed, state.context.stacks.length);
            }
          }

          switch (state.value) {
            case 'deployed':
              return resolve();
            case 'rolledBack':
            case 'failed': {
              this.printer.stopBars();
              promptsPrinter.info(`Rolled back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`);
              const deploymentErrors = new DeploymentError(state.context.errors);
              this.logger('DeploymentManager', [{ stateValue: state.value }])(deploymentErrors);
              return reject(deploymentErrors);
            }
            default:
            // intentionally left blank as we don't care about intermediate states
          }
          return undefined;
        })
        .start();
      service.send({ type: 'DEPLOY' });
    });
  };

  public rollback = async (deploymentStateManager: IDeploymentStateManager): Promise<void> => {
    this.deploymentStateManager = deploymentStateManager;
    const { currentStepIndex } = this.deploymentStateManager.getStatus();
    const maxDeployed = currentStepIndex + 1;

    const deploymentTemplates = this.deployment.reduce<Set<string>>((acc, step) => {
      acc.add(step.rollback.stackTemplatePath);
      return acc;
    }, new Set());
    await Promise.all(Array.from(deploymentTemplates.values()).map((path) => this.ensureTemplateExists(path)));
    const fns: StateMachineHelperFunctions = {
      preRollbackTableCheck: this.preRollbackTableCheck,
      rollbackFn: this.rollBackStack,
      tableReadyWaitFn: this.waitForIndices,
      rollbackWaitFn: this.waitForDeployment,
      stackEventPollFn: this.stackPollFn,
      startRollbackFn: this.startRollBackFn,
    };
    const machine = createRollbackDeploymentMachine(
      {
        currentIndex: maxDeployed,
        previousDeploymentIndex: currentStepIndex,
        deploymentBucket: this.deploymentBucket,
        region: this.region,
        stacks: this.deployment,
      },
      fns,
    );

    return new Promise((resolve, reject) => {
      const service = interpret(machine)
        .onTransition((state) => {
          if (state.changed) {
            const rollbackSpinnerState = Object.keys(rollbackSpinnerMessages).find((key) => state.matches(key));
            if (rollbackSpinnerState) {
              const rollbackSpinnerMessage = rollbackSpinnerMessages[rollbackSpinnerState];
              this.logger(rollbackSpinnerMessage.machine, [{ spinner: rollbackSpinnerMessage.message }])();
              this.spinner.start(rollbackSpinnerMessage.message);
            } else if (state.matches('rolledBack')) {
              this.updateTerminalOnEventCompletion(`Rolled back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`);
              this.logger('rollback', [{ spinner: 'Rolled back successfully' }]);
            } else if (state.matches('rollback')) {
              this.spinner.stop();
              const message = `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`;
              this.logger('rollback', [{ spinner: message }])();
            }
          }

          switch (state.value) {
            case 'rolledBack':
              return resolve();
            case 'failed': {
              this.printer.stopBars();
              const deploymentErrors = new DeploymentError(state.context.errors);
              this.logger('DeploymentManager', [{ stateValue: state.value }])(deploymentErrors);
              return reject(deploymentErrors);
            }
            default:
            // intentionally left blank as we don't care about intermediate states
          }
          return undefined;
        })
        .start();
      service.send({ type: 'ROLLBACK' });
    });
  };

  public addStep = (deploymentStep: DeploymentStep): void => {
    const deploymentStackTemplateUrl = getHttpUrl(deploymentStep.deployment.stackTemplatePathOrUrl, this.deploymentBucket);
    const deploymentStackTemplatePath = getBucketKey(deploymentStep.deployment.stackTemplatePathOrUrl, this.deploymentBucket);

    const rollbackStackTemplateUrl = getHttpUrl(deploymentStep.rollback.stackTemplatePathOrUrl, this.deploymentBucket);
    const rollbackStackTemplatePath = getBucketKey(deploymentStep.rollback.stackTemplatePathOrUrl, this.deploymentBucket);

    this.deployment.push({
      deployment: {
        ...deploymentStep.deployment,
        stackTemplatePath: deploymentStackTemplatePath,
        stackTemplateUrl: deploymentStackTemplateUrl,
        region: this.region,
        clientRequestToken: deploymentStep.deployment.clientRequestToken
          ? `deploy-${deploymentStep.deployment.clientRequestToken}`
          : undefined,
      },
      rollback: {
        ...deploymentStep.rollback,
        stackTemplatePath: rollbackStackTemplatePath,
        stackTemplateUrl: rollbackStackTemplateUrl,
        region: this.region,
        clientRequestToken: deploymentStep.rollback.clientRequestToken
          ? `rollback-${deploymentStep.rollback.clientRequestToken}`
          : undefined,
      },
    });
  };

  public addRollbackStep = (rollbackStep: DeploymentOp): void => {
    const rollbackStackTemplateUrl = getHttpUrl(rollbackStep.stackTemplatePathOrUrl, this.deploymentBucket);
    const rollbackStackTemplatePath = getBucketKey(rollbackStep.stackTemplatePathOrUrl, this.deploymentBucket);

    this.deployment.push({
      deployment: null,
      rollback: {
        ...rollbackStep,
        stackTemplatePath: rollbackStackTemplatePath,
        stackTemplateUrl: rollbackStackTemplateUrl,
        region: this.region,
        clientRequestToken: rollbackStep.clientRequestToken ? `rollback-${rollbackStep.clientRequestToken}` : undefined,
      },
    });
  };

  public resetPrinter = (): void => {
    this.printer = new StackProgressPrinter(this.eventMap);
  };

  private updateTerminalOnEventCompletion = (eventCompletionText: string): void => {
    this.spinner.stop();
    this.printer.finishBars();
    this.printer.stopBars();
    promptsPrinter.info(eventCompletionText);
  };

  /**
   * Called when an deployment is failed and rolling back is started
   * @param deployMachineContext deployment machine context
   */
  private startRollBackFn = async (deployMachineContext: Readonly<DeployMachineContext>): Promise<void> => {
    try {
      await this.deploymentStateManager?.startRollback();
      await this.deploymentStateManager?.startCurrentStep();
    } catch (err) {
      // log err but rollback should not fail because updating the deployment status fails
      this.logger('startRollbackFn', [{ index: deployMachineContext.currentIndex }])(err);
    }
  };

  /**
   * Ensure that the stack is present and can be deployed
   * @param stackName name of the stack
   */
  private ensureStack = async (stackName: string): Promise<boolean> => {
    const result = await this.cfnClient.describeStacks({ StackName: stackName }).promise();
    return result.Stacks[0].StackStatus.endsWith('_COMPLETE');
  };

  /**
   * Checks the file exists in the path
   * @param templatePath path of the cloudformation file
   */
  private ensureTemplateExists = async (templatePath: string): Promise<boolean> => {
    try {
      const bucketKey = getBucketKey(templatePath, this.deploymentBucket);
      await this.s3Client.headObject({ Bucket: this.deploymentBucket, Key: bucketKey }).promise();
      return true;
    } catch (e) {
      throw new AmplifyError(
        'DeploymentError',
        {
          message:
            e.code === 'NotFound'
              ? `The cloudformation template ${templatePath} was not found in deployment bucket ${this.deploymentBucket}`
              : e.message,
          details: e.message,
        },
        e,
      );
    }
  };

  private getTableStatus = async (tableName: string): Promise<boolean> => {
    assert(tableName, 'table name should be passed');

    try {
      const response = await this.ddbClient.describeTable({ TableName: tableName }).promise();
      if (response.Table?.TableStatus === 'DELETING') {
        return false;
      }
      const globalSecondaryIndexes = response.Table?.GlobalSecondaryIndexes;
      return globalSecondaryIndexes ? globalSecondaryIndexes.every((idx) => idx.IndexStatus === 'ACTIVE') : true;
    } catch (err) {
      if (err?.code === 'ResourceNotFoundException') {
        return true; // in the case of an iterative update that recreates a table, non-existence means the table has been fully removed
      }
      throw new AmplifyFault(
        'ServiceCallFault',
        {
          message: err.message,
        },
        err,
      );
    }
  };

  private waitForActiveTables = async (tables: string[]): Promise<void> => {
    const throttledGetTableStatus = throttle(this.getTableStatus, this.options.throttleDelay);
    const waiters = tables.map(
      (name) =>
        new Promise((resolve) => {
          const interval = setInterval(() => {
            void throttledGetTableStatus(name).then((areIndexesReady) => {
              if (areIndexesReady) {
                clearInterval(interval);
                resolve(undefined);
              }
            });
          }, this.options.throttleDelay);
        }),
    );
    await Promise.all(waiters);
  };

  private waitForIndices = async (stackParams: DeploymentMachineOp): Promise<void> => {
    if (stackParams.tableNames.length) {
      // cfn is async to ddb gsi creation the api can return true before the gsi creation starts
      await new Promise((res) => setTimeout(res, 2000));
    }
    await this.waitForActiveTables(stackParams.tableNames);
    try {
      await this.deploymentStateManager?.advanceStep();
    } catch {
      // deployment should not fail because saving status failed
    }
    return Promise.resolve();
  };

  private preRollbackTableCheck = async (stackParams: DeploymentMachineOp): Promise<void> => {
    await this.waitForActiveTables(stackParams.tableNames);
  };

  private stackPollFn = (deploymentStep: DeploymentMachineOp): (() => Promise<void>) => {
    assert(deploymentStep.stackName, 'stack name should be passed to stackPollFn');
    const monitor = new StackEventMonitor(this.cfnClient, deploymentStep.stackName, this.printer.print, this.printer.addActivity);
    monitor.start();
    return async () => {
      if (monitor) {
        await monitor.stop();
      }
    };
  };

  private doDeploy = async (currentStack: DeploymentMachineOp): Promise<void> => {
    try {
      await this.deploymentStateManager?.startCurrentStep({ previousMetaKey: currentStack.previousMetaKey });
    } catch {
      // deployment should not fail because status could not be saved
    }
    const cfn = this.cfnClient;

    assert(currentStack.stackName, 'stack name should be passed to doDeploy');
    assert(currentStack.stackTemplateUrl, 'stackTemplateUrl must be passed to doDeploy');

    await this.ensureStack(currentStack.stackName);

    const parameters = Object.entries(currentStack.parameters).map(([key, val]) => ({
      ParameterKey: key,
      ParameterValue: val.toString(),
    }));

    await cfn
      .updateStack({
        StackName: currentStack.stackName,
        Parameters: parameters,
        TemplateURL: currentStack.stackTemplateUrl,
        Capabilities: currentStack.capabilities,
        ClientRequestToken: currentStack.clientRequestToken,
      })
      .promise();
  };

  private waitForDeployment = async (stackParams: DeploymentMachineOp): Promise<void> => {
    const { cfnClient } = this;
    assert(stackParams.stackName, 'stackName should be passed to waitForDeployment');

    await cfnClient
      .waitFor('stackUpdateComplete', {
        StackName: stackParams.stackName,
      })
      .promise();
  };

  private rollBackStack = async (currentStack: Readonly<DeploymentMachineOp>): Promise<void> => {
    await this.doDeploy(currentStack);
  };
}
