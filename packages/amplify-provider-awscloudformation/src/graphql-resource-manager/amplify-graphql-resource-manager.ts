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

export const DISABLE_GSI_LIMIT_CHECK_OPTION = 'disable-gsi-limit-check';

const ROOT_LEVEL = 'root';
const RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME = '_root';
const CONNECTION_STACK_NAME = 'ConnectionStack';
const SEARCHABLE_STACK_NAME = 'SearchableStack';

/**
 * Type for GQLResourceManagerProps
 */
export type GQLResourceManagerProps = {
  cfnClient: CloudFormation;
  resourceMeta?: ResourceMeta;
  backendDir: string;
  cloudBackendDir: string;
  rebuildAllTables?: boolean;
  disableGSILimitCheck?: boolean;
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
  private readonly disableGSILimitCheck;

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
      disableGSILimitCheck: context?.input?.options?.[DISABLE_GSI_LIMIT_CHECK_OPTION],
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
    this.disableGSILimitCheck = props.disableGSILimitCheck || false;
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

      const nestedStacks = this.templateState.getKeys().filter((k) => k !== RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME);
      const tableNames = [];
      nestedStacks.forEach((stackName) => {
        if (stackName !== CONNECTION_STACK_NAME && stackName !== SEARCHABLE_STACK_NAME) {
          // Connection stack is not provisioning dynamoDB table and need to be filtered
          tableNames.push(tableNameMap.get(stackName));
        }
        const nestedStackFilePath = path.join(stepPath, 'stacks', `${stackName}.json`);
        fs.ensureDirSync(path.dirname(nestedStackFilePath));
        JSONUtilities.writeJson(nestedStackFilePath, this.templateState.pop(stackName));
      });

      // Update the root stack template when it is changed in template state
      if (this.templateState.has(RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME)) {
        const rootStackFilePath = path.join(stepPath, 'cloudformation-template.json');
        fs.ensureDirSync(path.dirname(rootStackFilePath));
        JSONUtilities.writeJson(rootStackFilePath, this.templateState.pop(RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME));
      }

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
    const recreatedTables = this.getTablesBeingReplaced();
    recreatedTables.forEach((tableMeta) => {
      const ddbStack = this.getStack(tableMeta.stackName, currentState);
      this.dropTemplateResources(ddbStack);
      // clear any other states created by GSI updates as dropping and recreating supersedes those changes
      this.clearTemplateState(tableMeta.stackName);
      this.templateState.add(tableMeta.stackName, JSONUtilities.stringify(ddbStack));
    });

    /**
     * When rebuild api, the root stack needs to change the reference to nested stack output values to temporary null placeholder value
     * as there will be no output from nested stacks.
     */
    if (this.rebuildAllTables) {
      const rootStack = this.getStack(ROOT_LEVEL, currentState);
      const connectionStack = this.getStack(CONNECTION_STACK_NAME, currentState);
      const searchableStack = this.getStack(SEARCHABLE_STACK_NAME, currentState);
      const allRecreatedNestedStackNames = recreatedTables.map((tableMeta) => tableMeta.stackName);
      // Drop resources and outputs for connection stack if existed
      if (connectionStack) {
        allRecreatedNestedStackNames.push(CONNECTION_STACK_NAME);
        this.dropTemplateResources(connectionStack);
        this.templateState.add(CONNECTION_STACK_NAME, JSONUtilities.stringify(connectionStack));
      }
      // Drop resources and outputs for searchable stack if existed
      if (searchableStack) {
        allRecreatedNestedStackNames.push(SEARCHABLE_STACK_NAME);
        this.dropTemplateResourcesForSearchableStack(searchableStack);
        this.templateState.add(SEARCHABLE_STACK_NAME, JSONUtilities.stringify(searchableStack));
      }
      // Update nested stack params in root stack
      this.replaceRecreatedNestedStackParamsInRootStackTemplate(allRecreatedNestedStackNames, rootStack);
      this.templateState.add(RESERVED_ROOT_STACK_TEMPLATE_STATE_KEY_NAME, JSONUtilities.stringify(rootStack));
    }
  };

  /**
   * Set recreated nested stack parameters to 'TemporaryPlaceholderValue' in root stack template
   * @param recreatedNestedStackNames names of recreated stacks
   * @param rootStack root stack template
   */
  private replaceRecreatedNestedStackParamsInRootStackTemplate(recreatedNestedStackNames: string[], rootStack: Template) {
    recreatedNestedStackNames.forEach((stackName) => {
      const stackParamsMap = rootStack.Resources[stackName].Properties.Parameters;
      Object.keys(stackParamsMap).forEach((stackParamKey) => {
        const paramObj = stackParamsMap[stackParamKey];
        const paramObjKeys = Object.keys(paramObj);
        if (paramObjKeys.length === 1 && paramObjKeys[0] === 'Fn::GetAtt') {
          const paramObjValue = paramObj[paramObjKeys[0]];
          if (
            Array.isArray(paramObjValue) &&
            paramObjValue.length === 2 &&
            recreatedNestedStackNames.includes(paramObjValue[0]) &&
            paramObjValue[1].startsWith('Outputs.')
          ) {
            stackParamsMap[stackParamKey] = 'TemporaryPlaceholderValue';
          }
        }
      });
    });
  }

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
    template.Resources[tableName] = addGSI(gsiRecord, table, this.disableGSILimitCheck);
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

  /**
   * Remove all outputs and resources except for search domain for searchable stack
   * @param template stack CFN tempalte
   */
  private dropTemplateResourcesForSearchableStack = (template: Template): void => {
    const OpenSearchDomainLogicalID = 'OpenSearchDomain';
    const searchDomain = template.Resources[OpenSearchDomainLogicalID];
    template.Resources = {};
    template.Resources[OpenSearchDomainLogicalID] = searchDomain;
    template.Outputs = {};
  };

  private clearTemplateState = (stackName: string) => {
    while (this.templateState.has(stackName)) {
      this.templateState.pop(stackName);
    }
  };

  private getTableNameFromTemplate = (template: Template): string | undefined =>
    Object.entries(template?.Resources || {}).find(([, resource]) => resource.Type === 'AWS::DynamoDB::Table')?.[0];
}
