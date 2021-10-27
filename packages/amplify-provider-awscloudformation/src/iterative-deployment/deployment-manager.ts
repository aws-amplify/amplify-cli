import * as aws from 'aws-sdk';

import { $TSContext, IDeploymentStateManager } from 'amplify-cli-core';
import {
  DeployMachineContext,
  DeploymentMachineOp,
  DeploymentMachineStep,
  StateMachineHelperFunctions,
  createDeploymentMachine,
  createRollbackDeploymentMachine,
  StateMachineError,
} from './state-machine';
import { IStackProgressPrinter, StackEventMonitor } from './stack-event-monitor';
import { getBucketKey, getHttpUrl } from './helpers';

import { ConfigurationOptions } from 'aws-sdk/lib/config-base';
import { StackProgressPrinter } from './stack-progress-printer';
import assert from 'assert';
import { loadConfiguration } from '../configuration-manager';
import { interpret } from 'xstate';
import ora from 'ora';
import throttle from 'lodash.throttle';
import { fileLogger, Logger } from '../utils/aws-logger';
interface DeploymentManagerOptions {
  throttleDelay?: number;
  eventPollingDelay?: number;
  userAgent?: string;
}

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

export type DeploymentOp = Omit<DeploymentMachineOp, 'region' | 'stackTemplatePath' | 'stackTemplateUrl'> & {
  stackTemplatePathOrUrl: string;
};

export type DeploymentStep = {
  deployment: DeploymentOp;
  rollback: DeploymentOp;
};

export class DeploymentManager {
  /**
   * Helper method to get an instance of the Deployment manager with the right credentials
   */

  public static createInstance = async (
    context: $TSContext,
    deploymentBucket: string,
    spinner: ora.Ora,
    options?: DeploymentManagerOptions,
    printer?: IStackProgressPrinter,
  ) => {
    try {
      const cred = await loadConfiguration(context);
      assert(cred.region);
      return new DeploymentManager(cred, cred.region, deploymentBucket, spinner, printer, options);
    } catch (e) {
      throw new Error('Could not load the credentials');
    }
  };

  private deployment: DeploymentMachineStep[] = [];
  private options: Required<DeploymentManagerOptions>;
  private cfnClient: aws.CloudFormation;
  private s3Client: aws.S3;
  private ddbClient: aws.DynamoDB;
  private deploymentStateManager?: IDeploymentStateManager;
  private logger: Logger;

  private constructor(
    creds: ConfigurationOptions,
    private region: string,
    private deploymentBucket: string,
    private spinner: ora.Ora,
    private printer: IStackProgressPrinter = new StackProgressPrinter(),
    options: DeploymentManagerOptions = {},
  ) {
    this.options = {
      throttleDelay: 1_000,
      eventPollingDelay: 1_000,
      userAgent: undefined,
      ...options,
    };

    this.s3Client = new aws.S3(creds);
    this.cfnClient = new aws.CloudFormation({ ...creds, maxRetries: 10, customUserAgent: this.options.userAgent });
    this.ddbClient = new aws.DynamoDB({ ...creds, region, maxRetries: 10 });
    this.logger = fileLogger('deployment-manager');
  }

  public deploy = async (deploymentStateManager: IDeploymentStateManager): Promise<void> => {
    this.deploymentStateManager = deploymentStateManager;

    // sanity check before deployment
    const deploymentTemplates = this.deployment.reduce<Set<string>>((acc, step) => {
      acc.add(step.deployment.stackTemplatePath);
      acc.add(step.rollback.stackTemplatePath);
      return acc;
    }, new Set());
    await Promise.all(Array.from(deploymentTemplates.values()).map(path => this.ensureTemplateExists(path)));

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

    return new Promise(async (resolve, reject) => {
      const service = interpret(machine)
        .onTransition(async state => {
          if (state.changed) {
            this.spinner.render();
            maxDeployed = Math.max(maxDeployed, state.context.currentIndex + 1);
            if (state.matches('idle')) {
              this.logSpinnerMessage('deploy', `Starting deployment`);
            } else if (state.matches('deploy.waitForTablesToBeReady')) {
              this.logSpinnerMessage('deploy', `Waiting for DynamoDB indices to be ready`);
            } else if (state.matches('deploy')) {
              this.logSpinnerMessage('deploy', `Deploying (${maxDeployed} of ${state.context.stacks.length})`);
            } else if (state.matches('rollback')) {
              this.logSpinnerMessage('deploy', `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`);
            } else if (state.matches('deployed')) {
              this.logger('DeploymentManager', [{ spinner: 'Deployed' }])();
              this.spinner.succeed(`Deployed`);
            }
          }

          switch (state.value) {
            case 'deployed':
              return resolve();
            case 'rolledBack':
            case 'failed':
              const deploymentErrors = new DeploymentError(state.context.errors);
              this.logger('DeploymentManager', [{ stateValue: state.value }])(deploymentErrors);
              return reject(deploymentErrors);
            default:
            // intentionally left blank as we don't care about intermediate states
          }
        })
        .start();
      service.send({ type: 'DEPLOY' });
    });
  };

  public rollback = async (deploymentStateManager: IDeploymentStateManager): Promise<void> => {
    this.deploymentStateManager = deploymentStateManager;
    let currentStepIndex = this.deploymentStateManager.getStatus().currentStepIndex;
    let maxDeployed = currentStepIndex + 1;

    const deploymentTemplates = this.deployment.reduce<Set<string>>((acc, step) => {
      acc.add(step.rollback.stackTemplatePath);
      return acc;
    }, new Set());
    await Promise.all(Array.from(deploymentTemplates.values()).map(path => this.ensureTemplateExists(path)));
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

    return new Promise(async (resolve, reject) => {
      const service = interpret(machine)
        .onTransition(async state => {
          if (state.changed) {
            this.spinner.render();
            if (state.matches('idle')) {
              this.logSpinnerMessage('rollback', `Starting rollback`);
            } else if (state.matches('preRollback')) {
              this.logSpinnerMessage('rollback', `Waiting for previous deployment to finish`);
            } else if (state.matches('rollback.waitForTablesToBeReady')) {
              this.logSpinnerMessage('rollback', `Waiting for DynamoDB indices to be ready`);
            } else if (state.matches('rollback')) {
              this.logSpinnerMessage('rollback', `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`);
            } else if (state.matches('rolledBack')) {
              this.spinner.succeed(`Rolled back succesfully`);
              this.logger('rollback', [{ spinner: 'Rolled back successfully' }])();
            }
          }

          switch (state.value) {
            case 'rolledBack':
              return resolve();
            case 'failed':
              const deploymentErrors = new DeploymentError(state.context.errors);
              this.logger('DeploymentManager', [{ stateValue: state.value }])(deploymentErrors);
              return reject(deploymentErrors);
            default:
            // intentionally left blank as we don't care about intermediate states
          }
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

  public setPrinter = (printer: IStackProgressPrinter) => {
    this.printer = printer;
  };

  /**
   * Called when an deployment is failed and rolling back is started
   * @param context deployment machie context
   */
  private startRollBackFn = async (_: Readonly<DeployMachineContext>): Promise<void> => {
    try {
      await this.deploymentStateManager?.startRollback();
      await this.deploymentStateManager?.startCurrentStep();
    } catch (err) {
      // log err but rollback should not fail because updating the deployment status fails
      this.logger('startRolbackFn', [{ index: _.currentIndex }])(err);
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
      if (e.code === 'NotFound') {
        throw new Error(`The cloudformation template ${templatePath} was not found in deployment bucket ${this.deploymentBucket}`);
      }
      this.logger('ensureTemplateExists', [{ templatePath }])(e);
      throw e;
    }
  };

  private getTableStatus = async (tableName: string): Promise<boolean> => {
    assert(tableName, 'table name should be passed');

    try {
      const response = await this.ddbClient.describeTable({ TableName: tableName }).promise();
      const gsis = response.Table?.GlobalSecondaryIndexes;
      return gsis ? gsis.every(idx => idx.IndexStatus === 'ACTIVE') : true;
    } catch (err) {
      this.logger('getTableStatus', [{ tableName }])(err);
      throw err;
    }
  };

  private waitForActiveTables = async (tables: string[]): Promise<void> => {
    const throttledGetTableStatus = throttle(this.getTableStatus, this.options.throttleDelay);
    const waiters = tables.map(name => {
      return new Promise(resolve => {
        let interval = setInterval(async () => {
          const areIndexesReady = await throttledGetTableStatus(name);
          if (areIndexesReady) {
            clearInterval(interval);
            resolve(undefined);
          }
        }, this.options.throttleDelay);
      });
    });
    await Promise.all(waiters);
  };

  private waitForIndices = async (stackParams: DeploymentMachineOp) => {
    if (stackParams.tableNames.length) {
      // cfn is async to ddb gsi creation the api can return true before the gsi creation starts
      await new Promise(res => setTimeout(res, 2000));
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

  private stackPollFn = (deploymentStep: DeploymentMachineOp): (() => void) => {
    let monitor: StackEventMonitor;
    assert(deploymentStep.stackName, 'stack name should be passed to stackPollFn');
    if (this.printer) {
      monitor = new StackEventMonitor(this.cfnClient, deploymentStep.stackName, this.printer);
      monitor.start();
    }
    return () => {
      if (monitor) {
        monitor.stop();
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

    const parameters = Object.entries(currentStack.parameters).map(([key, val]) => {
      return {
        ParameterKey: key,
        ParameterValue: val.toString(),
      };
    });

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
    const cfnClient = this.cfnClient;
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

  /**
   *
   * @param machine which state machine is the spinner message coming from
   * @param message the message to log and show on the spinner
   */
  private logSpinnerMessage = (machine: string, message: string): void => {
    this.logger(machine, [{ spinner: message }])();
    this.spinner.text = message;
  };
}
