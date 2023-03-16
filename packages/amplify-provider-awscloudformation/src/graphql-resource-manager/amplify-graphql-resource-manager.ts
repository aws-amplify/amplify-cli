import {
  $TSAny,
  $TSContext,
  AmplifyError,
  AmplifyFault,
  AMPLIFY_SUPPORT_DOCS,
  JSONUtilities,
  pathManager,
} from '@aws-amplify/amplify-cli-core';
import { DynamoDB, Template } from 'cloudform-types';
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
import fs from 'fs-extra';
import path from 'path';
import { DeploymentOp, DeploymentStep, DEPLOYMENT_META } from '../iterative-deployment';
import { DiffChanges, DiffableProject, getGQLDiff } from './utils';
import { GSIChange, getGSIDiffs } from './gsi-diff-helpers';
import { GSIRecord, TemplateState, getPreviousDeploymentRecord, getTableNames } from '../utils/amplify-resource-state-utils';
import { ROOT_APPSYNC_S3_KEY, hashDirectory } from '../upload-appsync-files';
import { addGSI, getGSIDetails, removeGSI } from './dynamodb-gsi-helpers';

import { loadConfiguration } from '../configuration-manager';

const ROOT_LEVEL = 'root';

/**
 * Type for GQLResourceManagerProps
 */
export type GQLResourceManagerProps = {
  cfnClient: CloudFormation;
  resourceMeta?: ResourceMeta;
  backendDir: string;
  cloudBackendDir: string;
  rebuildAllTables?: boolean;
};

/**
 * Type for ResourceMeta
 */
export type ResourceMeta = {
  category: string;
  providerPlugin: string;
  resourceName: string;
  service: string;
  output: $TSAny;
  providerMetadata: {
    s3TemplateURL: string;
    logicalId: string;
  };
  stackId: string;
  DeploymentBucketName: string;
  [key: string]: $TSAny;
};

// TODO: Add unit testing
/**
 * Type for GraphQLResourceManager
 */
export class GraphQLResourceManager {
  static serviceName = 'AppSync';
  static categoryName = 'api';
  private cfnClient: CloudFormation;
  private resourceMeta: ResourceMeta;
  private cloudBackendApiProjectRoot: string;
  private backendApiProjectRoot: string;
  private templateState: TemplateState;
  private rebuildAllTables = false; // indicates that all underlying model tables should be rebuilt

  public static createInstance = async (
    context: $TSContext,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gqlResource: any,
    StackId: string,
    rebuildAllTables = false,
  ): Promise<GraphQLResourceManager> => {
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
      rebuildAllTables,
    });
  };

  constructor(props: GQLResourceManagerProps) {
    if (!props.resourceMeta) {
      throw new AmplifyError('CategoryNotEnabledError', {
        message: 'No GraphQL API enabled.',
        link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
      });
    }

    this.cfnClient = props.cfnClient;

    this.resourceMeta = props.resourceMeta;
    this.backendApiProjectRoot = path.join(props.backendDir, GraphQLResourceManager.categoryName, this.resourceMeta.resourceName);
    this.cloudBackendApiProjectRoot = path.join(props.cloudBackendDir, GraphQLResourceManager.categoryName, this.resourceMeta.resourceName);
    this.templateState = new TemplateState();
    this.rebuildAllTables = props.rebuildAllTables || false;
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
        throw new AmplifyFault(
          'UnknownFault',
          {
            message: err.message,
            link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
          },
          err,
        );
      }
    }
    if (!this.rebuildAllTables) {
      this.gsiManagement(gqlDiff.diff, gqlDiff.current, gqlDiff.next);
    }
    this.tableRecreationManagement(gqlDiff.current);
    // eslint-disable-next-line no-return-await
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
    let { previousMetaKey } = previousStep;

    while (!this.templateState.isEmpty()) {
      const stepNumber = count.toString().padStart(2, '0');
      const stepPath = path.join(stateFileDir, stepNumber);

      fs.copySync(previousStepPath, stepPath);
      previousStepPath = stepPath;

      const tables = this.templateState.getKeys();
      const tableNames = [];
      tables.forEach((tableName) => {
        tableNames.push(tableNameMap.get(tableName));
        const tableNameStackFilePath = path.join(stepPath, 'stacks', `${tableName}.json`);
        fs.ensureDirSync(path.dirname(tableNameStackFilePath));
        JSONUtilities.writeJson(tableNameStackFilePath, this.templateState.pop(tableName));
      });

      const deploymentRootKey = `${ROOT_APPSYNC_S3_KEY}/${buildHash}/states/${stepNumber}`;
      const deploymentStep: DeploymentOp = {
        stackTemplatePathOrUrl: `${deploymentRootKey}/cloudformation-template.json`,
        previousMetaKey,
        parameters: { ...parameters, S3DeploymentRootKey: deploymentRootKey },
        stackName: this.resourceMeta.stackId,
        tableNames,
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
   * get a copy of last deployed API nested stack to rollback to in case deployment fails
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private gsiManagement = (diffs: DiffChanges, currentState: DiffableProject, nextState: DiffableProject): any => {
    const gsiChanges = _.filter(diffs, (diff) => diff.path.includes('GlobalSecondaryIndexes'));

    const tableWithGSIChanges = _.uniqBy(gsiChanges, (diff) => diff.path?.slice(0, 3).join('/')).map((gsiChange) => {
      const tableName = (gsiChange.path[0] === ROOT_LEVEL ? gsiChange.path[2] : gsiChange.path[3]) as string;
      const stackName = (gsiChange.path[0] === ROOT_LEVEL ? ROOT_LEVEL : gsiChange.path[1].split('.')[0]) as string;

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
      const { stackName } = gsiChange;
      const { tableName } = gsiChange;
      if (stackName === ROOT_LEVEL) {
        // eslint-disable-next-line no-continue
        continue;
      }
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
            throw new AmplifyFault('UnknownFault', {
              message: `Unknown GSI change type ${changeStep.type}`,
              link: AMPLIFY_SUPPORT_DOCS.CLI_GRAPHQL_TROUBLESHOOTING.url,
            });
        }
      }
    }
  };

  private tableRecreationManagement = (currentState: DiffableProject) => {
    this.getTablesBeingReplaced().forEach((tableMeta) => {
      const ddbStack = this.getStack(tableMeta.stackName, currentState);
      this.dropTemplateResources(ddbStack);

      // clear any other states created by GSI updates as dropping and recreating supersedes those changes
      this.clearTemplateState(tableMeta.stackName);
      this.templateState.add(tableMeta.stackName, JSONUtilities.stringify(ddbStack));
    });
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getTablesBeingReplaced = (): any => {
    const gqlDiff = getGQLDiff(this.backendApiProjectRoot, this.cloudBackendApiProjectRoot);
    const [diffs, currentState] = [gqlDiff.diff, gqlDiff.current];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getTablesRequiringReplacement = (): any => {
      if (!diffs) {
        return [];
      }
      return _.uniq(
        diffs
          // diff.path looks like [ "stacks", "ModelName.json", "Resources", "TableName", "Properties", "KeySchema", 0, "AttributeName"]
          .filter((diff) => {
            const keySchemaModified = diff.kind === 'E' && diff.path.length === 8 && diff.path[5] === 'KeySchema';
            const sortKeyAddedOrRemoved = diff.kind === 'A' && diff.path.length === 6 && diff.path[5] === 'KeySchema' && diff.index === 1;
            const localSecondaryIndexModified = diff.path.some((pathEntry) => pathEntry === 'LocalSecondaryIndexes');
            return keySchemaModified || sortKeyAddedOrRemoved || localSecondaryIndexModified;
          }) // filter diffs with changes that require replacement
          .map((diff) => ({
            // extract table name and stack name from diff path
            tableName: diff.path?.[3] as string,
            stackName: diff.path[1].split('.')[0] as string,
          })),
      ) as { tableName: string; stackName: string }[];
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getAllTables = (): any =>
      Object.entries(currentState.stacks)
        .map(([name, template]) => ({
          tableName: this.getTableNameFromTemplate(template),
          stackName: path.basename(name, '.json'),
        }))
        .filter((meta) => !!meta.tableName);
    return this.rebuildAllTables ? getAllTables() : getTablesRequiringReplacement();
  };

  private getTable = (gsiChange: Diff<any, any>, proj: DiffableProject): DynamoDB.Table => {
    if (gsiChange.path[0] === ROOT_LEVEL) {
      return proj.root.Resources[gsiChange.path[2]] as DynamoDB.Table;
    }
    return proj.stacks[gsiChange.path[1]].Resources[gsiChange.path[3]] as DynamoDB.Table;
  };

  private getStack = (stackName: string, proj: DiffableProject): Template => {
    if (stackName === ROOT_LEVEL) {
      return proj.root;
    }
    return proj.stacks[`${stackName}.json`];
  };

  private addGSI = (gsiRecord: GSIRecord, tableName: string, template: Template): void => {
    const table = template.Resources[tableName] as DynamoDB.Table;
    template.Resources[tableName] = addGSI(gsiRecord, table);
  };

  private deleteGSI = (indexName: string, tableName: string, template: Template): void => {
    const table = template.Resources[tableName] as DynamoDB.Table;
    template.Resources[tableName] = removeGSI(indexName, table);
  };

  private dropTemplateResources = (template: Template): void => {
    // remove all resources from table stack except one placeholder resource
    template.Resources = {};
    // CloudFormation requires at least one resource so setting a placeholder
    // https://stackoverflow.com/a/62991447/5283094
    template.Resources.PlaceholderNullResource = { Type: 'AWS::CloudFormation::WaitConditionHandle' };
    template.Outputs = {};
  };

  private clearTemplateState = (stackName: string) => {
    while (this.templateState.has(stackName)) {
      this.templateState.pop(stackName);
    }
  };

  private getTableNameFromTemplate = (template: Template): string | undefined =>
    Object.entries(template?.Resources || {}).find(([_, resource]) => resource.Type === 'AWS::DynamoDB::Table')?.[0];
}
