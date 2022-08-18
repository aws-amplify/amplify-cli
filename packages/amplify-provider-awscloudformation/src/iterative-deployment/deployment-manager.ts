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
import { AmplifySpinner } from 'amplify-prompts';
interface DeploymentManagerOptions {
  throttleDelay?: number;
  eventPollingDelay?: number;
  userAgent?: string;
}

const deploy_spinner_message = {
  'idle': { machine: 'deploy', message: `Starting deployment.` },
  'deploy.waitForTablesToBeReady': { machine: 'deploy', message: `Waiting for DynamoDB indices to be ready.` },
}

const rollback_spinner_message = {
  'idle': { machine: 'rollback', message: `Starting rollback.` },
  'preRollback': { machine: 'rollback', message: `Waiting for previous deployment to finish.` },
  'rollback.waitForTablesToBeReady': { machine: 'rollback', message: `Waiting for DynamoDB indices to be ready.` },
};
 
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

type EventMap = {
  rootStackName: string,
  envName: string,
  projectName: string,
  rootResources: {key: string, category: string}[],
  eventToCategories: Map<string, string>,
  categories: {name: string, size: number}[]
}

export class DeploymentManager {
  /**
   * Helper method to get an instance of the Deployment manager with the right credentials
   */

  public static createInstance = async (
    context: $TSContext,
    deploymentBucket: string,
    eventMap: EventMap,
    options?: DeploymentManagerOptions,
  ) => {
    try {
      const cred = await loadConfiguration(context);
      assert(cred.region);
      return new DeploymentManager(cred, cred.region, deploymentBucket, eventMap, options);
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
    this.cfnClient = new aws.CloudFormation({ ...creds, maxRetries: 10, customUserAgent: this.options.userAgent });
    this.ddbClient = new aws.DynamoDB({ ...creds, region, maxRetries: 10 });
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
            maxDeployed = Math.max(maxDeployed, state.context.currentIndex + 1);

            const key = Object.keys(deploy_spinner_message).find(elm => state.matches(elm));
            if (key) {
              const keyObj = deploy_spinner_message[key];
              this.logger(keyObj['machine'], [{ spinner: keyObj['message'] }])();
              if (!this.printer || (this.printer && !this.printer.isRunning())) {
                this.spinner.start(keyObj['message']);
              }
            } else if (state.matches('deployed')) {
              this.spinner.stop();
              this.printer.finishBars();
              this.printer.stopBars();
              this.logger('DeploymentManager', [{ spinner: 'Deployed' }]);
              console.log(`Deployed (${maxDeployed-1} of ${state.context.stacks.length})`);
              this.resetPrinter();
            } else if (state.matches('deploy') || state.matches('rollback')) {
              this.spinner.stop();
              const currIndex =  state.context.currentIndex;
              const message = state.matches('deploy') ? `Deploying (${maxDeployed} of ${state.context.stacks.length})` :
              `Rolling back (${maxDeployed - currIndex} of ${maxDeployed})`;
              this.logger('deploy', [{ spinner: message}])();
            }

          }

          switch (state.value) {
            case 'deployed':
              return resolve();
            case 'rolledBack':
            case 'failed':
              this.printer.stopBars();
              console.log(`Rolled back (${maxDeployed -state.context.currentIndex} of ${maxDeployed})`)
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
            const key = Object.keys(rollback_spinner_message).find(elm => state.matches(elm));
            if (key) {
              const keyObj = rollback_spinner_message[key];
              this.logger(keyObj['machine'], [{ spinner: keyObj['message'] }])();
              this.spinner.start(keyObj['message']);
            } else if (state.matches('rolledBack')) {
              this.spinner.stop();
              this.printer.finishBars();
              this.printer.stopBars();
              console.log(`Rolled back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`)
              this.logger('rollback', [{ spinner: 'Rolled back successfully' }]);
            } else if (state.matches('rollback')) {
              this.spinner.stop();
              const message = `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`;
              this.logger('rollback', [{ spinner: message}])();
            }
          }

          switch (state.value) {
            case 'rolledBack':
              return resolve();
            case 'failed':
              this.printer.stopBars();
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

  public resetPrinter = () => {
    if (this.printer) {
      this.printer = null;
    }
    this.printer = new StackProgressPrinter(this.eventMap);
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
      if (response.Table?.TableStatus === 'DELETING') {
        return false;
      }
      const gsis = response.Table?.GlobalSecondaryIndexes;
      return gsis ? gsis.every(idx => idx.IndexStatus === 'ACTIVE') : true;
    } catch (err) {
      if (err?.code === 'ResourceNotFoundException') {
        return true; // in the case of an iterative update that recreates a table, non-existance means the table has been fully removed
      }
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

  private printLogs = () => {
    this.printer.print();
  }

  private addPrinterEvent = (event) => {
    this.printer.addActivity(event);
  } 

  private stackPollFn = (deploymentStep: DeploymentMachineOp): (() => void) => {
    let monitor: StackEventMonitor;
    assert(deploymentStep.stackName, 'stack name should be passed to stackPollFn');
    monitor = new StackEventMonitor(this.cfnClient, deploymentStep.stackName, this.printLogs, this.addPrinterEvent);
    monitor.start();
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
  // private logSpinnerMessage = (machine: string, message: string): void => {
  //   this.logger(machine, [{ spinner: message }])();
  //   this.spinner.text = message;
  // };
}
