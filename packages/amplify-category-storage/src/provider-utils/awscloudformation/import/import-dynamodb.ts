import { $TSAny, $TSContext, $TSObject, ServiceSelection, stateManager } from 'amplify-cli-core';
import { printer } from 'amplify-prompts';
import { IDynamoDBService } from 'amplify-util-import';
import Enquirer from 'enquirer';
import _ from 'lodash';
import { importMessages } from './messages';
import {
  DynamoDBBackendConfiguration,
  DynamoDBEnvSpecificResourceParameters,
  DynamoDBImportAnswers,
  DynamoDBImportParameters,
  DynamoDBMetaConfiguration,
  DynamoDBMetaOutput,
  DynamoDBResourceParameters,
  ImportDynamoDBHeadlessParameters,
  ProviderUtils,
} from './types';

const attrReverseMap: $TSObject = {
  S: 'string',
  N: 'number',
  B: 'binary',
  BOOL: 'boolean',
  L: 'list',
  M: 'map',
  NULL: null,
  SS: 'string-set',
  NS: 'number-set',
  BS: 'binary-set',
};

export const importDynamoDB = async (
  context: $TSContext,
  serviceSelection: ServiceSelection,
  previousResourceParameters: DynamoDBResourceParameters | undefined,
  providerPluginInstance?: ProviderUtils,
  printSuccessMessage: boolean = true,
): Promise<{ envSpecificParameters: DynamoDBEnvSpecificResourceParameters } | undefined> => {
  // Load provider
  const providerPlugin = providerPluginInstance || (await import(serviceSelection.provider));
  const providerUtils = providerPlugin as ProviderUtils;

  const importServiceWalkthroughResult = await importServiceWalkthrough(
    context,
    serviceSelection.providerName,
    providerUtils,
    previousResourceParameters,
  );

  if (!importServiceWalkthroughResult) {
    return;
  }

  const { questionParameters, answers } = importServiceWalkthroughResult;

  // If there were previous params then we dont want to update env params, instead return it.
  const persistEnvParameters = !previousResourceParameters;

  const { envSpecificParameters } = await updateStateFiles(context, questionParameters, answers, persistEnvParameters);

  if (printSuccessMessage) {
    printSuccess(answers.tableName!);
  }

  return {
    envSpecificParameters,
  };
};

const printSuccess = (tableName: string) => {
  printer.blankLine();
  printer.info(`✅ DynamoDB Table '${tableName}' was successfully imported.`);
  printer.blankLine();
  printer.info('Next steps:');
  printer.info(`- This resource can now be accessed from REST APIs (‘amplify add api’) and Functions (‘amplify add function’)`);
};

const importServiceWalkthrough = async (
  context: $TSContext,
  providerName: string,
  providerUtils: ProviderUtils,
  previousResourceParameters: DynamoDBResourceParameters | undefined,
): Promise<{ questionParameters: DynamoDBImportParameters; answers: DynamoDBImportAnswers } | undefined> => {
  const dynamoDB = await providerUtils.createDynamoDBService(context);
  const amplifyMeta = stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];

  // Get list of user pools to see if there is anything to import
  let tableList = await dynamoDB.listTables();

  // Remove already present tables from choices
  const storageResources = <{ service: string; output: { Name: string } }[]>Object.values(_.get(amplifyMeta, ['storage'], []));
  const dynamoDBResources = storageResources.filter(r => r.service === 'DynamoDB' && !!r.output && !!r.output.Name).map(r => r.output.Name);

  tableList = tableList.filter(t => !dynamoDBResources.includes(t));

  // Return it no userpools found in the project's region
  if (_.isEmpty(tableList)) {
    printer.info(importMessages.NoDynamoDBTablesToImport);
    return;
  }

  const questionParameters: DynamoDBImportParameters = createParameters(providerName, tableList);

  // Save the region as we need to store it in resource parameters
  questionParameters.region = Region;

  const defaultAnswers: DynamoDBImportAnswers = {
    resourceName: previousResourceParameters?.resourceName,
  };

  const answers: DynamoDBImportAnswers = { ...defaultAnswers };

  const enquirer = new Enquirer<DynamoDBImportAnswers>(undefined, defaultAnswers);

  if (tableList.length === 1) {
    answers.tableName = tableList[0];

    answers.resourceName = answers.tableName.replace(/[\W_]+/g, '');
    answers.tableDescription = await dynamoDB.getTableDetails(answers.tableName);

    printer.info(importMessages.OneTable(answers.tableName));
  } else {
    const tableNameQuestion = {
      type: 'autocomplete',
      name: 'tableName',
      message: importMessages.TableSelection,
      required: true,
      choices: tableList,
      limit: 5,
      footer: importMessages.AutoCompleteFooter,
    };

    const { tableName } = await enquirer.prompt(tableNameQuestion as $TSAny); // any case needed because async validation TS definition is not up to date

    answers.tableName = tableName!;
    answers.resourceName = answers.tableName!.replace(/[\W_]+/g, '');

    answers.tableDescription = await dynamoDB.getTableDetails(answers.tableName);
  }

  return {
    questionParameters,
    answers,
  };
};

const createParameters = (providerName: string, tableList: string[]): DynamoDBImportParameters => {
  const questionParameters: DynamoDBImportParameters = {
    providerName,
    tableList,
  };

  return questionParameters;
};

const updateStateFiles = async (
  context: $TSContext,
  questionParameters: DynamoDBImportParameters,
  answers: DynamoDBImportAnswers,
  updateEnvSpecificParameters: boolean,
): Promise<{
  backendConfiguration: DynamoDBBackendConfiguration;
  resourceParameters: DynamoDBResourceParameters;
  metaConfiguration: DynamoDBMetaConfiguration;
  envSpecificParameters: DynamoDBEnvSpecificResourceParameters;
}> => {
  const backendConfiguration: DynamoDBBackendConfiguration = {
    service: 'DynamoDB',
    serviceType: 'imported',
    providerPlugin: questionParameters.providerName,
    dependsOn: [],
  };

  // Create and persist parameters
  const resourceParameters: DynamoDBResourceParameters = {
    resourceName: answers.resourceName!,
    serviceType: 'imported',
  };

  stateManager.setResourceParametersJson(undefined, 'storage', answers.resourceName!, resourceParameters);

  // Add resource data to amplify-meta file and backend-config, since backend-config requires less information
  // we have to do a separate update to it without duplicating the methods
  const metaConfiguration = _.clone(backendConfiguration) as DynamoDBMetaConfiguration;
  metaConfiguration.output = createMetaOutput(answers, questionParameters);

  context.amplify.updateamplifyMetaAfterResourceAdd('storage', answers.resourceName!, metaConfiguration, backendConfiguration, true);

  // Update team provider-info
  const envSpecificParameters: DynamoDBEnvSpecificResourceParameters = createEnvSpecificResourceParameters(answers, questionParameters);

  if (updateEnvSpecificParameters) {
    context.amplify.saveEnvResourceParameters(context, 'storage', answers.resourceName!, envSpecificParameters);
  }

  return {
    backendConfiguration,
    resourceParameters,
    metaConfiguration,
    envSpecificParameters,
  };
};

const createMetaOutput = (answers: DynamoDBImportAnswers, questionParameters: DynamoDBImportParameters): DynamoDBMetaOutput => {
  const output: DynamoDBMetaOutput = {
    Name: answers.tableName,
    Region: questionParameters.region,
    Arn: answers.tableDescription!.TableArn,
    StreamArn: answers.tableDescription!.LatestStreamArn,
  };

  const hashKey = answers.tableDescription!.KeySchema?.find(ks => ks.KeyType === 'HASH');
  const sortKeys = answers.tableDescription!.KeySchema?.filter(ks => ks.KeyType === 'RANGE');

  if (hashKey) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find(a => a.AttributeName === hashKey.AttributeName);

    if (attribute) {
      output.PartitionKeyName = hashKey.AttributeName;
      output.PartitionKeyType = attrReverseMap[attribute.AttributeType];
    }
  }

  if (sortKeys && sortKeys.length > 0) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find(a => a.AttributeName === sortKeys[0].AttributeName);

    if (attribute) {
      output.SortKeyName = sortKeys[0].AttributeName;
      output.SortKeyType = attrReverseMap[attribute.AttributeType];
    }
  }

  return output;
};

const createEnvSpecificResourceParameters = (
  answers: DynamoDBImportAnswers,
  questionParameters: DynamoDBImportParameters,
): DynamoDBEnvSpecificResourceParameters => {
  const envSpecificResourceParameters: DynamoDBEnvSpecificResourceParameters = {
    tableName: answers.tableName!,
    region: questionParameters.region!,
    arn: answers.tableDescription!.TableArn,
    streamArn: answers.tableDescription!.LatestStreamArn,
  };

  const hashKey = answers.tableDescription!.KeySchema?.find(ks => ks.KeyType === 'HASH');
  const sortKeys = answers.tableDescription!.KeySchema?.filter(ks => ks.KeyType === 'RANGE');

  if (hashKey) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find(a => a.AttributeName === hashKey.AttributeName);

    if (attribute) {
      envSpecificResourceParameters.partitionKeyName = hashKey.AttributeName;
      envSpecificResourceParameters.partitionKeyType = attrReverseMap[attribute.AttributeType];
    }
  }

  if (sortKeys && sortKeys.length > 0) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find(a => a.AttributeName === sortKeys[0].AttributeName);

    if (attribute) {
      envSpecificResourceParameters.sortKeyName = sortKeys[0].AttributeName;
      envSpecificResourceParameters.sortKeyType = attrReverseMap[attribute.AttributeType];
    }
  }

  return envSpecificResourceParameters;
};

export const importedDynamoDBEnvInit = async (
  context: $TSContext,
  resourceName: string,
  resource: DynamoDBMetaConfiguration,
  resourceParameters: DynamoDBResourceParameters,
  providerName: string,
  providerUtils: ProviderUtils,
  currentEnvSpecificParameters: DynamoDBEnvSpecificResourceParameters,
  isInHeadlessMode: boolean,
  headlessParams: ImportDynamoDBHeadlessParameters,
): Promise<{ doServiceWalkthrough?: boolean; succeeded?: boolean; envSpecificParameters?: DynamoDBEnvSpecificResourceParameters }> => {
  const dynamoDB = await providerUtils.createDynamoDBService(context);
  const amplifyMeta = stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands[0] === 'pull');
  const isEnvAdd = context.input.command === 'env' && context.input.subCommands[0] === 'add';

  if (isInHeadlessMode) {
    // Validate required parameters' presence and merge into parameters
    return await headlessImport(context, dynamoDB, providerName, resourceName, resource, resourceParameters, headlessParams);
  }

  // If we are pulling, take the current values if present to skip unneeded service walkthrough
  if (isPulling) {
    const currentMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentMeta) {
      const currentResource = _.get(currentMeta, ['storage', resourceName], undefined);

      if (currentResource && currentResource.output) {
        const { Name, Region, Arn, StreamArn, PartitionKeyName, PartitionKeyType, SortKeyName, SortKeyType } = currentResource.output;

        currentEnvSpecificParameters.tableName = Name;
        currentEnvSpecificParameters.region = Region;
        currentEnvSpecificParameters.arn = Arn;
        currentEnvSpecificParameters.streamArn = StreamArn;
        currentEnvSpecificParameters.partitionKeyName = PartitionKeyName;
        currentEnvSpecificParameters.partitionKeyType = PartitionKeyType;
        currentEnvSpecificParameters.sortKeyName = SortKeyName;
        currentEnvSpecificParameters.sortKeyType = SortKeyType;
      }
    }
  } else if (isEnvAdd && context.exeInfo.sourceEnvName) {
    // Check to see if we have a source environment set (in case of env add), and ask customer if the want to import the same resource
    // from the existing environment or import a different one. Check if all the values are having some value that can be validated and
    // if not fall back to full service walkthrough.
    const sourceEnvParams = getSourceEnvParameters(context.exeInfo.sourceEnvName, 'storage', resourceName);

    if (sourceEnvParams) {
      const { importExisting } = await Enquirer.prompt<{ importExisting: boolean }>({
        name: 'importExisting',
        type: 'confirm',
        message: importMessages.ImportPreviousTable(resourceName, sourceEnvParams.tableName, context.exeInfo.sourceEnvName),
        footer: importMessages.ImportPreviousResourceFooter,
        initial: true,
        format: (e: $TSAny) => (e ? 'Yes' : 'No'),
      } as $TSAny);

      if (!importExisting) {
        return {
          doServiceWalkthrough: true,
        };
      }

      // Copy over the required input arguments to currentEnvSpecificParameters
      currentEnvSpecificParameters.tableName = sourceEnvParams.tableName;
      currentEnvSpecificParameters.region = sourceEnvParams.region;
      currentEnvSpecificParameters.arn = sourceEnvParams.arn;
      currentEnvSpecificParameters.streamArn = sourceEnvParams.streamArn;
      currentEnvSpecificParameters.partitionKeyName = sourceEnvParams.partitionKeyName;
      currentEnvSpecificParameters.partitionKeyType = sourceEnvParams.partitionKeyType;
      currentEnvSpecificParameters.sortKeyName = sourceEnvParams.sortKeyName;
      currentEnvSpecificParameters.sortKeyType = sourceEnvParams.sortKeyType;
    }
  }

  // If there are no current parameters a service walkthrough is required, it can happen when pulling to an empty directory.
  if (!(currentEnvSpecificParameters.tableName && currentEnvSpecificParameters.region)) {
    printer.info(importMessages.ImportNewResourceRequired(resourceName));

    return {
      doServiceWalkthrough: true,
    };
  }

  // Validate the parameters, generate the missing ones and import the resource.
  const questionParameters: DynamoDBImportParameters = {
    providerName,
    tableList: [],
    region: Region,
  };

  const answers: DynamoDBImportAnswers = {
    resourceName: resourceParameters.resourceName,
    tableName: currentEnvSpecificParameters.tableName,
  };

  const tableExists = await dynamoDB.tableExists(currentEnvSpecificParameters.tableName);

  if (!tableExists) {
    printer.error(importMessages.TableNotFound(currentEnvSpecificParameters.tableName));

    return {
      succeeded: false,
    };
  }

  answers.tableDescription = await dynamoDB.getTableDetails(currentEnvSpecificParameters.tableName);

  const newState = await updateStateFiles(context, questionParameters, answers, false);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

const headlessImport = async (
  context: $TSContext,
  dynamoDB: IDynamoDBService,
  providerName: string,
  resourceName: string,
  resource: DynamoDBMetaConfiguration,
  resourceParameters: DynamoDBResourceParameters,
  headlessParams: ImportDynamoDBHeadlessParameters,
): Promise<{ succeeded: boolean; envSpecificParameters: DynamoDBEnvSpecificResourceParameters }> => {
  // Validate required parameters' presence and merge into parameters
  const currentEnvSpecificParameters = ensureHeadlessParameters(resourceParameters, headlessParams);

  const amplifyMeta = stateManager.getMeta();
  const { Region } = amplifyMeta.providers[providerName];

  // Validate the parameters, generate the missing ones and import the resource.
  const questionParameters: DynamoDBImportParameters = {
    providerName,
    tableList: [],
    region: Region,
  };

  const answers: DynamoDBImportAnswers = {
    resourceName: resourceParameters.resourceName,
    tableName: currentEnvSpecificParameters.tableName,
  };

  const tableExists = await dynamoDB.tableExists(currentEnvSpecificParameters.tableName);

  if (!tableExists) {
    throw new Error(importMessages.TableNotFound(currentEnvSpecificParameters.tableName));
  }

  answers.tableDescription = await dynamoDB.getTableDetails(currentEnvSpecificParameters.tableName);

  const newState = await updateStateFiles(context, questionParameters, answers, false);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

const ensureHeadlessParameters = (
  resourceParameters: DynamoDBResourceParameters,
  headlessParams: ImportDynamoDBHeadlessParameters,
): DynamoDBEnvSpecificResourceParameters => {
  // If we are doing headless mode, validate parameter presence and overwrite the input values from env specific params since they can be
  // different for the current env operation (eg region can mismatch)

  // Validate required arguments to be present
  const missingParams = [];

  if (!headlessParams.tables) {
    missingParams.push('tables');
  }

  if (!headlessParams.region) {
    missingParams.push('region');
  }

  if (missingParams.length > 0) {
    throw new Error(`storage headless is missing the following inputParams ${missingParams.join(', ')}`);
  }

  const tableParams = Object.keys(headlessParams.tables).filter(t => t === resourceParameters.resourceName);

  if (tableParams?.length !== 1) {
    throw new Error(
      `storage headless expected 1 element for resource: ${resourceParameters.resourceName}, but found: ${tableParams.length}`,
    );
  }

  const envSpecificParameters: DynamoDBEnvSpecificResourceParameters = {
    tableName: headlessParams.tables[tableParams[0]],
    region: headlessParams.region,
  };

  return envSpecificParameters;
};

const getSourceEnvParameters = (
  envName: string,
  categoryName: string,
  resourceName: string,
): DynamoDBEnvSpecificResourceParameters | undefined => {
  const teamProviderInfo = stateManager.getTeamProviderInfo(undefined, {
    throwIfNotExist: false,
  });

  if (teamProviderInfo) {
    const envParameters = _.get(teamProviderInfo, [envName, 'categories', categoryName, resourceName], undefined);

    return envParameters;
  }

  return undefined;
};
