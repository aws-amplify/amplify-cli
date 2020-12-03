import * as aws from 'aws-sdk';
import assert from 'assert';
import throttle from 'lodash.throttle';
import {
  createDeploymentMachine,
  DeploymentMachineOp,
  DeploymentMachineStep,
  StateMachineHelperFunctions,
  DeployMachineContext,
} from './state-machine';
import { interpret } from 'xstate';
import { IStackProgressPrinter, StackEventMonitor } from './stack-event-monitor';
import { StackProgressPrinter } from './stack-progress-printer';
import ora from 'ora';
import configurationManager from '../configuration-manager';
import { $TSContext, IDeploymentStateManager } from 'amplify-cli-core';
import { ConfigurationOptions } from 'aws-sdk/lib/config-base';
import { getBucketKey, getHttpUrl } from './helpers';
interface DeploymentManagerOptions {
  throttleDelay?: number;
  eventPollingDelay?: number;
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
    printer?: IStackProgressPrinter,
    options?: DeploymentManagerOptions,
  ) => {
    try {
      const cred = await configurationManager.loadConfiguration(context);
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
  private deploymentStateManager?: IDeploymentStateManager;

  private constructor(
    creds: ConfigurationOptions,
    private region: string,
    private deploymentBucket: string,
    private spinner: ora.Ora,
    // private deployedTemplatePath: string,
    private printer: IStackProgressPrinter = new StackProgressPrinter(),
    options: DeploymentManagerOptions = {},
  ) {
    this.options = {
      throttleDelay: 1_000,
      eventPollingDelay: 1_000,
      ...options,
    };

    this.s3Client = new aws.S3(creds);
    this.cfnClient = new aws.CloudFormation({ ...creds, maxRetries: 10 });
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
            if (state.matches('idle')) {
              this.spinner.text = `Starting deployment`;
            } else if (state.matches('deploy')) {
              this.spinner.text = `Deploying stack (${maxDeployed} of ${state.context.stacks.length})`;
            } else if (state.matches('rollback')) {
              this.spinner.text = `Rolling back (${maxDeployed - state.context.currentIndex} of ${maxDeployed})`;
            } else if (state.matches('deployed')) {
              this.spinner.succeed(`Deployed`);
            }
          }

          switch (state.value) {
            case 'deployed':
              return resolve();
            case 'rolledBack':
            case 'failed':
              return reject(new Error('Deployment failed'));
              break;
            default:
            // intentionally left blank as we don't care about intermediate states
          }
        })
        .start();
      service.send({ type: 'DEPLOY' });
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
    } catch {
      // ignore, rollback should not fail because updating the deployment status fails
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
      if (e.ccode === 'NotFound') {
        throw new Error(`The cloudformation template ${templatePath} was not found in deployment bucket ${this.deploymentBucket}`);
      }
      throw e;
    }
  };

  private getTableStatus = async (tableName: string, region: string): Promise<boolean> => {
    assert(tableName, 'table name should be passed');

    const dbClient = new aws.DynamoDB({ region });

    const response = await dbClient.describeTable({ TableName: tableName }).promise();
    const gsis = response.Table?.GlobalSecondaryIndexes;

    return gsis ? gsis.every(idx => idx.IndexStatus === 'ACTIVE') : true;
  };

  private waitForIndices = async (stackParams: DeploymentMachineOp) => {
    if (stackParams.tableNames.length) console.log('\nWaiting for DynamoDB table indices to be ready');
    const throttledGetTableStatus = throttle(this.getTableStatus, this.options.throttleDelay);

    const waiters = stackParams.tableNames.map(name => {
      return new Promise(resolve => {
        let interval = setInterval(async () => {
          const areIndexesReady = await throttledGetTableStatus(name, this.region);
          if (areIndexesReady) {
            clearInterval(interval);
            resolve(undefined);
          }
        }, this.options.throttleDelay);
      });
    });

    await Promise.all(waiters);
    try {
      await this.deploymentStateManager?.advanceStep();
    } catch {
      // deployment should not fail because saving status failed
    }
    return Promise.resolve();
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
      await this.deploymentStateManager?.startCurrentStep();
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
}
