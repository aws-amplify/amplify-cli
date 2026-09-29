import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import { $TSAny, $TSContext, AmplifyCategories, AmplifyError, ServiceSelection, stateManager } from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { IDynamoDBService } from '@aws-amplify/amplify-util-import';
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

/**
 * entry point for importing DynamoDB table
 */
export const importDynamoDB = async (
  context: $TSContext,
  serviceSelection: ServiceSelection,
  previousResourceParameters: DynamoDBResourceParameters | undefined,
  providerPluginInstance?: ProviderUtils,
  printSuccessMessage = true,
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
    return undefined;
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

const printSuccess = (tableName: string): void => {
  printer.blankLine();
  printer.info(`✅ DynamoDB Table '${tableName}' was successfully imported.`);
  printer.blankLine();
  printer.info('Next steps:');
  printer.info('- This resource can now be accessed from REST APIs (`amplify add api`) and Functions (`amplify add function`)');
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
  const storageResources = <{ service: string; output: { Name: string } }[]>(
    Object.values(_.get(amplifyMeta, [AmplifyCategories.STORAGE], []))
  );
  const dynamoDBResources = storageResources
    .filter((r) => r.service === 'DynamoDB' && !!r.output && !!r.output.Name)
    .map((r) => r.output.Name);

  tableList = tableList.filter((t) => !dynamoDBResources.includes(t));

  // Return if no User Pool found in the project's region
  if (_.isEmpty(tableList)) {
    printer.info(importMessages.NoDynamoDBTablesToImport);
    return undefined;
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
    // eslint-disable-next-line prefer-destructuring
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

    // any case needed because async validation TS definition is not up to date
    const { tableName } = await enquirer.prompt(tableNameQuestion as $TSAny);

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

  stateManager.setResourceParametersJson(undefined, AmplifyCategories.STORAGE, answers.resourceName!, resourceParameters);

  // Add resource data to amplify-meta file and backend-config, since backend-config requires less information
  // we have to do a separate update to it without duplicating the methods
  const metaConfiguration = _.clone(backendConfiguration) as DynamoDBMetaConfiguration;
  metaConfiguration.output = createMetaOutput(answers, questionParameters);

  context.amplify.updateamplifyMetaAfterResourceAdd(
    AmplifyCategories.STORAGE,
    answers.resourceName!,
    metaConfiguration,
    backendConfiguration,
    true,
  );

  // Update team provider-info
  const envSpecificParameters: DynamoDBEnvSpecificResourceParameters = createEnvSpecificResourceParameters(answers, questionParameters);

  if (updateEnvSpecificParameters) {
    context.amplify.saveEnvResourceParameters(context, AmplifyCategories.STORAGE, answers.resourceName!, envSpecificParameters);
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

  const hashKey = answers.tableDescription!.KeySchema?.find((ks) => ks.KeyType === 'HASH');
  const sortKeys = answers.tableDescription!.KeySchema?.filter((ks) => ks.KeyType === 'RANGE');

  if (hashKey) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find((a) => a.AttributeName === hashKey.AttributeName);

    if (attribute) {
      output.PartitionKeyName = hashKey.AttributeName;
      output.PartitionKeyType = attribute.AttributeType;
    }
  }

  if (sortKeys && sortKeys.length > 0) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find((a) => a.AttributeName === sortKeys[0].AttributeName);

    if (attribute) {
      output.SortKeyName = sortKeys[0].AttributeName;
      output.SortKeyType = attribute.AttributeType;
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

  const hashKey = answers.tableDescription!.KeySchema?.find((ks) => ks.KeyType === 'HASH');
  const sortKeys = answers.tableDescription!.KeySchema?.filter((ks) => ks.KeyType === 'RANGE');

  if (hashKey) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find((a) => a.AttributeName === hashKey.AttributeName);

    if (attribute) {
      envSpecificResourceParameters.partitionKeyName = hashKey.AttributeName;
      envSpecificResourceParameters.partitionKeyType = attribute.AttributeType;
    }
  }

  if (sortKeys && sortKeys.length > 0) {
    const attribute = answers.tableDescription!.AttributeDefinitions?.find((a) => a.AttributeName === sortKeys[0].AttributeName);

    if (attribute) {
      envSpecificResourceParameters.sortKeyName = sortKeys[0].AttributeName;
      envSpecificResourceParameters.sortKeyType = attribute.AttributeType;
    }
  }

  return envSpecificResourceParameters;
};

/**
 * Setup new environment with imported DynamoDB table
 */
export const importedDynamoDBEnvInit = async (
  context: $TSContext,
  resourceName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands?.[0] === 'pull');
  const isEnvAdd = context.input.command === 'env' && context.input.subCommands?.[0] === 'add';

  if (isInHeadlessMode) {
    // Validate required parameters' presence and merge into parameters
    return headlessImport(context, dynamoDB, providerName, resourceParameters, headlessParams, currentEnvSpecificParameters);
  }

  // If we are pulling, take the current values if present to skip unneeded service walkthrough
  if (isPulling) {
    const currentMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentMeta) {
      const currentResource = _.get(currentMeta, [AmplifyCategories.STORAGE, resourceName], undefined);

      if (currentResource && currentResource.output) {
        const {
          // eslint-disable-next-line @typescript-eslint/no-shadow
          Name,
          Region,
          Arn,
          StreamArn,
          PartitionKeyName,
          PartitionKeyType,
          SortKeyName,
          SortKeyType,
        } = currentResource.output;

        /* eslint-disable no-param-reassign */
        currentEnvSpecificParameters.tableName = Name;
        currentEnvSpecificParameters.region = Region;
        currentEnvSpecificParameters.arn = Arn;
        currentEnvSpecificParameters.streamArn = StreamArn;
        currentEnvSpecificParameters.partitionKeyName = PartitionKeyName;
        currentEnvSpecificParameters.partitionKeyType = PartitionKeyType;
        currentEnvSpecificParameters.sortKeyName = SortKeyName;
        currentEnvSpecificParameters.sortKeyType = SortKeyType;
        /* eslint-enable */
      }
    }
  } else if (isEnvAdd && context.exeInfo.sourceEnvName) {
    // Check to see if we have a source environment set (in case of env add), and ask customer if the want to import the same resource
    // from the existing environment or import a different one. Check if all the values are having some value that can be validated and
    // if not fall back to full service walkthrough.
    const resourceParamManager = (await ensureEnvParamManager(context.exeInfo.sourceEnvName)).instance.getResourceParamManager(
      AmplifyCategories.STORAGE,
      resourceName,
    );

    if (resourceParamManager.hasAnyParams()) {
      const { importExisting } = await Enquirer.prompt<{ importExisting: boolean }>({
        name: 'importExisting',
        type: 'confirm',
        message: importMessages.ImportPreviousTable(
          resourceName,
          resourceParamManager.getParam(DynamoDBParam.TABLE_NAME)!,
          context.exeInfo.sourceEnvName,
        ),
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
      /* eslint-disable no-param-reassign */
      currentEnvSpecificParameters.tableName = resourceParamManager.getParam(DynamoDBParam.TABLE_NAME)!;
      currentEnvSpecificParameters.region = resourceParamManager.getParam(DynamoDBParam.REGION)!;
      currentEnvSpecificParameters.arn = resourceParamManager.getParam(DynamoDBParam.ARN);
      currentEnvSpecificParameters.streamArn = resourceParamManager.getParam(DynamoDBParam.STREAM_ARN);
      currentEnvSpecificParameters.partitionKeyName = resourceParamManager.getParam(DynamoDBParam.PARTITION_KEY_NAME);
      currentEnvSpecificParameters.partitionKeyType = resourceParamManager.getParam(DynamoDBParam.PARTITION_KEY_TYPE);
      currentEnvSpecificParameters.sortKeyName = resourceParamManager.getParam(DynamoDBParam.SORT_KEY_NAME);
      currentEnvSpecificParameters.sortKeyType = resourceParamManager.getParam(DynamoDBParam.SORT_KEY_TYPE);
      /* eslint-enable */
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
  resourceParameters: DynamoDBResourceParameters,
  headlessParams: ImportDynamoDBHeadlessParameters,
  currentEnvSpecificParameters: DynamoDBEnvSpecificResourceParameters,
): Promise<{ succeeded: boolean; envSpecificParameters: DynamoDBEnvSpecificResourceParameters }> => {
  // Validate required parameters' presence and merge into parameters
  const resolvedEnvParams =
    headlessParams?.tables || headlessParams?.region
      ? ensureHeadlessParameters(resourceParameters, headlessParams)
      : currentEnvSpecificParameters;

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
    tableName: resolvedEnvParams.tableName,
  };

  const tableExists = await dynamoDB.tableExists(resolvedEnvParams.tableName);

  if (!tableExists) {
    throw new AmplifyError('StorageImportError', { message: importMessages.TableNotFound(resolvedEnvParams.tableName) });
  }

  answers.tableDescription = await dynamoDB.getTableDetails(resolvedEnvParams.tableName);

  const newState = await updateStateFiles(context, questionParameters, answers, false);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

export const ensureHeadlessParameters = (
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
    throw new AmplifyError('InputValidationError', {
      message: `storage headless is missing the following inputParams ${missingParams.join(', ')}`,
      link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
    });
  }

  const tableParams = Object.keys(headlessParams.tables).filter((t) => t === resourceParameters.resourceName);

  if (tableParams?.length !== 1) {
    throw new AmplifyError('InputValidationError', {
      message: `storage headless expected 1 element for resource: ${resourceParameters.resourceName}, but found: ${tableParams.length}`,
      link: 'https://docs.amplify.aws/cli/usage/headless/#--categories',
    });
  }

  const envSpecificParameters: DynamoDBEnvSpecificResourceParameters = {
    tableName: headlessParams.tables[tableParams[0]],
    region: headlessParams.region,
  };

  return envSpecificParameters;
};

enum DynamoDBParam {
  TABLE_NAME = 'tableName',
  REGION = 'region',
  ARN = 'arn',
  STREAM_ARN = 'streamArn',
  PARTITION_KEY_NAME = 'partitionKeyName',
  PARTITION_KEY_TYPE = 'partitionKeyType',
  SORT_KEY_NAME = 'sortKeyName',
  SORT_KEY_TYPE = 'sortKeyType',
}
