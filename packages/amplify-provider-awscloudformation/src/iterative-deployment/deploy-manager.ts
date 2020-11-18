import * as aws from 'aws-sdk';
import assert from 'assert';
import throttle from 'lodash.throttle';
import { createDeploymentMachine, DeploymentStep, StackParameter, StateMachineHelperFunctions } from './state-machine';
import { interpret } from 'xstate';
import { IStackProgressPrinter, StackEventMonitor } from './stack-event-monitor';
import { StackProgressPrinter } from './stack-progress-printer';
import ora from 'ora';
import configurationManager from '../configuration-manager';
import { $TSContext } from 'amplify-cli-core';

interface DeploymentManagerOptions {
  throttleDelay?: number;
  eventPollingDelay?: number;
}
export class DeploymentManager {
  /**
   * Helper method to get an instance of the Deployment manager with the right credentials
   */

  public static createInstance = async (
    context: $TSContext,
    deploymentBucket: string,
    printer?: IStackProgressPrinter,
    options?: DeploymentManagerOptions,
  ) => {
    try {
      const cred = await configurationManager.loadConfiguration(context);
      assert(cred.region);
      return new DeploymentManager(new aws.CloudFormation(cred), cred.region, deploymentBucket, printer, options);
    } catch (e) {
      throw new Error('Could not load the credentials');
    }
  };

  private deployment: DeploymentStep[] = [];
  private options: Required<DeploymentManagerOptions>;

  private constructor(
    private cfnClient: aws.CloudFormation,
    private region: string,
    private deploymentBucket: string,
    private printer: IStackProgressPrinter = new StackProgressPrinter(),
    options: DeploymentManagerOptions = {},
  ) {
    this.options = {
      throttleDelay: 1_000,
      eventPollingDelay: 1_000,
      ...options,
    };
  }

  public deploy = async (): Promise<void> => {
    const fns: StateMachineHelperFunctions = {
      deployFn: this.doDeploy,
      deploymentWaitFn: this.waitForDeployment,
      rollbackFn: this.rollBackStack,
      tableReadyWaitFn: this.waitForIndices,
      rollbackWaitFn: this.waitForDeployment,
      stackEventPollFn: this.stackPollFn,
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
      const spinner = ora('Deploying');
      const service = interpret(machine)
        .onTransition(state => {
          if (state.changed) {
            maxDeployed = Math.max(maxDeployed, state.context.currentIndex + 1);
            if (state.matches('idle')) {
              spinner.text = `Starting deployment`;
            } else if (state.matches('deploy')) {
              spinner.text = `Deploying stack (${maxDeployed} of ${state.context.stacks.length})`;
            } else if (state.matches('rollback')) {
              spinner.text = `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`;
            } else if (state.matches('deployed')) {
              spinner.succeed(`Deployed`);
            }
          }

          switch (state.value) {
            case 'Deployed':
              return resolve();
            case 'rolledBack':
            case 'failed':
              spinner.fail(`Failed to deploy`);
              return reject(new Error('Deployment failed'));
            default:
            // intentionally left blank as we don't care about intermediate states
          }
        })
        .start();
      spinner.start();
      service.send({ type: 'DEPLOY' });
    });
  };

  public addStep = (deploymentStep: DeploymentStep): void => {
    this.deployment.push(deploymentStep);
  };

  public setPrinter = (printer: IStackProgressPrinter) => {
    this.printer = printer;
  };

  private getTableStatus = async (tableName: string, region: string): Promise<boolean | undefined> => {
    const dbClient = new aws.DynamoDB({ region });
    const response = await dbClient.describeTable({ TableName: tableName }).promise();

    return response.Table?.GlobalSecondaryIndexes?.every(idx => idx.IndexStatus === 'ACTIVE');
  };

  private waitForIndices = async (stackParams: StackParameter) => {
    if (stackParams.tableNames.length) console.log('Waiting for table indices to be created/deleted');
    const throttledGetTableStatus = throttle(this.getTableStatus, 1000);

    const waiters = stackParams.tableNames.map(name => {
      return new Promise(resolve => {
        let interval = setInterval(async () => {
          const areIndexesReady = await throttledGetTableStatus(name, this.region);
          if (areIndexesReady) {
            clearInterval(interval);
            resolve();
          }
        }, this.options.throttleDelay);
      });
    });

    try {
      await Promise.all(waiters);
      return Promise.resolve();
    } catch {
      Promise.reject();
    }
  };

  private stackPollFn = (deploymentStep: DeploymentStep): (() => void) => {
    let monitor: StackEventMonitor;
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

  private doDeploy = async (currentStack: {
    stackName: string;
    parameters: Record<string, string>;
    stackTemplateUrl: string;
    region: string;
  }): Promise<void> => {
    const cfn = this.cfnClient;
    const parameters = Object.entries(currentStack.parameters).map(([key, val]) => {
      return {
        ParameterKey: key,
        ParameterValue: val,
      };
    });
    try {
      await cfn
        .updateStack({
          StackName: currentStack.stackName,
          Parameters: parameters,
          TemplateURL: currentStack.stackTemplateUrl,
        })
        .promise();
    } catch (e) {
      return Promise.reject();
    }
  };

  private waitForDeployment = async (stackParams: StackParameter): Promise<void> => {
    const cfnClient = this.cfnClient;
    try {
      await cfnClient
        .waitFor('stackUpdateComplete', {
          StackName: stackParams.stackName,
        })
        .promise();
      return Promise.resolve();
    } catch (e) {
      return Promise.reject();
    }
  };

  private rollBackStack = async (currentStack: Readonly<StackParameter>): Promise<void> => {
    await this.doDeploy(currentStack);
  };
}
