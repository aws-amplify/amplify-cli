import { $TSContext, JSONUtilities, pathManager } from 'amplify-cli-core';
import { DeploymentOp, DeploymentStep, DEPLOYMENT_META } from '../iterative-deployment';
import { DiffChanges, DiffableProject, getGQLDiff } from './utils';
import { DynamoDB, Template } from 'cloudform-types';
import { GSIChange, getGSIDiffs } from './gsi-diff-helpers';
import { GSIRecord, TemplateState, getPreviousDeploymentRecord, getTableNames } from '../utils/amplify-resource-state-utils';
import { ROOT_APPSYNC_S3_KEY, hashDirectory } from '../upload-appsync-files';
import { addGSI, getGSIDetails, removeGSI } from './dynamodb-gsi-helpers';
import {
  cantAddAndRemoveGSIAtSameTimeRule,
  cantBatchMutateGSIAtUpdateTimeRule,
  cantEditGSIKeySchemaRule,
  cantHaveMoreThan500ResourcesRule,
  sanityCheckDiffs,
} from 'graphql-transformer-core';

import { CloudFormation } from 'aws-sdk';
import { Diff } from 'deep-diff';
import _ from 'lodash';
import { loadConfiguration } from '../configuration-manager';
import fs from 'fs-extra';
import path from 'path';

export type GQLResourceManagerProps = {
  cfnClient: CloudFormation;
  resourceMeta?: ResourceMeta;
  backendDir: string;
  cloudBackendDir: string;
};

export type ResourceMeta = {
  category: string;
  providerPlugin: string;
  resourceName: string;
  service: string;
  output: any;
  providerMetadata: {
    s3TemplateURL: string;
    logicalId: string;
  };
  stackId: string;
  DeploymentBucketName: string;
  [key: string]: any;
};

// TODO: Add unit testing
export class GraphQLResourceManager {
  static serviceName: string = 'AppSync';
  static categoryName: string = 'api';
  private cfnClient: CloudFormation;
  private resourceMeta: ResourceMeta;
  private cloudBackendApiProjectRoot: string;
  private backendApiProjectRoot: string;
  private templateState: TemplateState;

  public static createInstance = async (context: $TSContext, gqlResource: any, StackId: string) => {
    try {
      const cred = await loadConfiguration(context);
      const cfn = new CloudFormation(cred);
      const apiStack = await cfn
        .describeStackResources({ StackName: StackId, LogicalResourceId: gqlResource.providerMetadata.logicalId })
        .promise();
      return new GraphQLResourceManager({
        cfnClient: cfn,
        resourceMeta: { ...gqlResource, stackId: apiStack.StackResources[0].PhysicalResourceId },
        backendDir: pathManager.getBackendDirPath(),
        cloudBackendDir: pathManager.getCurrentCloudBackendDirPath(),
      });
    } catch (err) {
      throw err;
    }
  };

  constructor(props: GQLResourceManagerProps) {
    if (!props.resourceMeta) {
      throw Error('No GraphQL API enabled.');
    }

    this.cfnClient = props.cfnClient;

    this.resourceMeta = props.resourceMeta;
    this.backendApiProjectRoot = path.join(props.backendDir, GraphQLResourceManager.categoryName, this.resourceMeta.resourceName);
    this.cloudBackendApiProjectRoot = path.join(props.cloudBackendDir, GraphQLResourceManager.categoryName, this.resourceMeta.resourceName);
    this.templateState = new TemplateState();
  }

  run = async (): Promise<DeploymentStep[]> => {
    const gqlDiff = getGQLDiff(this.backendApiProjectRoot, this.cloudBackendApiProjectRoot);
    try {
      const diffRules = [
        // GSI
        cantEditGSIKeySchemaRule,
        cantBatchMutateGSIAtUpdateTimeRule,
        cantAddAndRemoveGSIAtSameTimeRule,
      ];

      const projectRules = [cantHaveMoreThan500ResourcesRule];

      sanityCheckDiffs(gqlDiff.diff, gqlDiff.current, gqlDiff.next, diffRules, projectRules);
    } catch (err) {
      if (err.name !== 'InvalidGSIMigrationError') {
        throw err;
      }
    }
    this.gsiManagement(gqlDiff.diff, gqlDiff.current, gqlDiff.next);
    return await this.getDeploymentSteps();
  };

  // save states to build with a copy of build on every deploy
  getDeploymentSteps = async (): Promise<DeploymentStep[]> => {
    if (this.templateState.isEmpty()) return [];
    let count = 1;

    const gqlSteps = new Array<DeploymentStep>();

    const cloudBuildDir = path.join(this.cloudBackendApiProjectRoot, 'build');

    const stateFileDir = this.getStateFilesDirectory();

    const tableNameMap = await getTableNames(this.cfnClient, this.templateState.getKeys(), this.resourceMeta.stackId);

    const { parameters, capabilities } = await getPreviousDeploymentRecord(this.cfnClient, this.resourceMeta.stackId);

    const buildHash = await hashDirectory(this.backendApiProjectRoot);

    // copy the last deployment state as current state
    let previousStepPath = cloudBuildDir;
    let previousStep: DeploymentOp = await this.getCurrentlyDeployedStackStep();
    let previousMetaKey = previousStep.previousMetaKey;

    while (!this.templateState.isEmpty()) {
      const stepNumber = count.toString().padStart(2, '0');
      const stepPath = path.join(stateFileDir, stepNumber);

      fs.copySync(previousStepPath, stepPath);
      previousStepPath = stepPath;

      const tables = this.templateState.getKeys();
      const tableNames = [];
      tables.forEach(tableName => {
        tableNames.push(tableNameMap.get(tableName));
        const tableNameStackFilePath = path.join(stepPath, 'stacks', `${tableName}.json`);
        fs.ensureDirSync(path.dirname(tableNameStackFilePath));
        JSONUtilities.writeJson(tableNameStackFilePath, this.templateState.pop(tableName));
      });

      const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildHash}/states/${stepNumber}`;
      const deploymentStep: DeploymentOp = {
        stackTemplatePathOrUrl: `${deploymentRootKey}/cloudformation-template.json`,
        previousMetaKey: previousMetaKey,
        parameters: { ...parameters, S3DeploymentRootKey: deploymentRootKey },
        stackName: this.resourceMeta.stackId,
        tableNames: tableNames,
        capabilities,
        // clientRequestToken: `${buildHash}-step-${stepNumber}`,
      };

      // save the current deployment step in the state
      const deploymentStepStatePath = path.join(stepPath, DEPLOYMENT_META);
      JSONUtilities.writeJson(deploymentStepStatePath, deploymentStep);

      gqlSteps.push({
        deployment: deploymentStep,
        rollback: previousStep,
      });
      // Current deployment step is the rollback step for next step
      previousStep = deploymentStep;
      previousMetaKey = `${deploymentRootKey}/${DEPLOYMENT_META}`;
      count++;
    }
    return gqlSteps;
  };

  /**
   * get a copy of last deployed API nested stack to rollback to incase deployment fails
   */
  public getCurrentlyDeployedStackStep = async (): Promise<DeploymentOp> => {
    const cloudBuildDir = path.join(this.cloudBackendApiProjectRoot, 'build');
    const stateFileDir = this.getStateFilesDirectory();

    const { parameters, capabilities } = await getPreviousDeploymentRecord(this.cfnClient, this.resourceMeta.stackId);
    const buildHash = await hashDirectory(this.backendApiProjectRoot);

    const stepNumber = 'initial-stack';
    const stepPath = path.join(stateFileDir, `${stepNumber}`);

    fs.copySync(cloudBuildDir, stepPath);

    const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildHash}/states/${stepNumber}`;
    const currentDeployedStep: DeploymentOp = {
      stackTemplatePathOrUrl: `${deploymentRootKey}/cloudformation-template.json`,
      previousMetaKey: `${deploymentRootKey}/${DEPLOYMENT_META}`,
      parameters: { ...parameters, S3DeploymentRootKey: deploymentRootKey },
      stackName: this.resourceMeta.stackId,
      capabilities,
      tableNames: [],
    };
    // save the current deployment step in the state
    const deploymentStateStep = path.join(stepPath, DEPLOYMENT_META);
    JSONUtilities.writeJson(deploymentStateStep, currentDeployedStep);
    return currentDeployedStep;
  };

  public getStateFilesDirectory = (): string => {
    const buildDir = path.join(this.backendApiProjectRoot, 'build');
    return path.join(buildDir, 'states');
  };

  public getCloudStateFilesDirectory = async (): Promise<string> => {
    const buildHash = await hashDirectory(this.backendApiProjectRoot);
    return `${ROOT_APPSYNC_S3_KEY}/${buildHash}/states`;
  };

  private gsiManagement = (diffs: DiffChanges<DiffableProject>, currentState: DiffableProject, nextState: DiffableProject) => {
    const gsiChanges = _.filter(diffs, diff => {
      return diff.path.includes('GlobalSecondaryIndexes');
    });

    const tableWithGSIChanges = _.uniqBy(gsiChanges, diff => diff.path?.slice(0, 3).join('/')).map(gsiChange => {
      const tableName = gsiChange.path[3];

      const stackName = gsiChange.path[1].split('.')[0];

      const currentTable = this.getTable(gsiChange, currentState);
      const nextTable = this.getTable(gsiChange, nextState);

      return {
        tableName,
        stackName,
        currentTable,
        nextTable,
      };
    });

    for (const gsiChange of tableWithGSIChanges) {
      const changeSteps = getGSIDiffs(gsiChange.currentTable, gsiChange.nextTable);
      const stackName = gsiChange.stackName;
      const tableName = gsiChange.tableName;
      for (const changeStep of changeSteps) {
        const ddbResource = this.templateState.getLatest(stackName) || this.getStack(stackName, currentState);
        let gsiRecord;
        switch (changeStep.type) {
          case GSIChange.Add:
            gsiRecord = getGSIDetails(changeStep.indexName, gsiChange.nextTable);
            this.addGSI(gsiRecord, tableName, ddbResource);
            this.templateState.add(stackName, JSONUtilities.stringify(ddbResource));
            break;

          case GSIChange.Delete:
            this.deleteGSI(changeStep.indexName, tableName, ddbResource);
            this.templateState.add(stackName, JSONUtilities.stringify(ddbResource));
            break;

          case GSIChange.Update:
            this.deleteGSI(changeStep.indexName, tableName, ddbResource);
            this.templateState.add(stackName, JSONUtilities.stringify(ddbResource));
            gsiRecord = getGSIDetails(changeStep.indexName, gsiChange.nextTable);
            this.addGSI(gsiRecord, tableName, ddbResource);
            this.templateState.add(stackName, JSONUtilities.stringify(ddbResource));
            break;

          default:
            assertUnreachable(changeStep.type);
        }
      }
    }
  };

  private getTable = (gsiChange: Diff<any, any>, proj: DiffableProject): DynamoDB.Table => {
    return proj.stacks[gsiChange.path[1]].Resources[gsiChange.path[3]] as DynamoDB.Table;
  };

  private getStack(stackName: string, proj: DiffableProject): Template {
    return proj.stacks[`${stackName}.json`];
  }

  private addGSI = (gsiRecord: GSIRecord, tableName: string, template: Template): void => {
    const table = template.Resources[tableName] as DynamoDB.Table;
    template.Resources[tableName] = addGSI(gsiRecord, table);
  };

  private deleteGSI = (indexName: string, tableName: string, template: Template): void => {
    const table = template.Resources[tableName] as DynamoDB.Table;
    template.Resources[tableName] = removeGSI(indexName, table);
  };
}

// https://stackoverflow.com/questions/39419170/how-do-i-check-that-a-switch-block-is-exhaustive-in-typescript
export const assertUnreachable = (_: never): never => {
  throw new Error('Default case should never reach');
};
