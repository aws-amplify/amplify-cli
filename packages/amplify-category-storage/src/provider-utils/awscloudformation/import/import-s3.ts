import { ensureEnvParamManager } from '@aws-amplify/amplify-environment-parameters';
import {
  $TSAny,
  $TSContext,
  AmplifyError,
  exitOnNextTick,
  ResourceAlreadyExistsError,
  ServiceSelection,
  stateManager,
} from '@aws-amplify/amplify-cli-core';
import { printer } from '@aws-amplify/amplify-prompts';
import { IS3Service } from '@aws-amplify/amplify-util-import';
import { Bucket } from '@aws-sdk/client-s3';
import Enquirer from 'enquirer';
import _ from 'lodash';
import { v4 as uuid } from 'uuid';
import { resourceAlreadyExists } from '../service-walkthroughs/s3-walkthrough';
// eslint-disable-next-line import/no-cycle
import { checkIfAuthExists } from '../storage-configuration-helpers';
import { importMessages } from './messages';
import {
  ImportS3HeadlessParameters,
  ProviderUtils,
  S3BackendConfiguration,
  S3EnvSpecificResourceParameters,
  S3ImportAnswers,
  S3ImportParameters,
  S3MetaConfiguration,
  S3MetaOutput,
  S3ResourceParameters,
} from './types';

/**
 * Entry point for importing s3 bucket
 */
export const importS3 = async (
  context: $TSContext,
  serviceSelection: ServiceSelection,
  previousResourceParameters: S3ResourceParameters | undefined,
  providerPluginInstance?: ProviderUtils,
  printSuccessMessage = true,
): Promise<{ envSpecificParameters: S3EnvSpecificResourceParameters } | undefined> => {
  const resourceName: string | undefined = resourceAlreadyExists();

  if (resourceName && !previousResourceParameters) {
    const errMessage = 'Amazon S3 storage was already added to your project.';
    printer.warn(errMessage);
    await context.usageData.emitError(new ResourceAlreadyExistsError(errMessage));

    exitOnNextTick(0);
  }

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

  // If there was a previousAuthSelection then we dont want to update env params, instead return it.
  const persistEnvParameters = !previousResourceParameters;

  const { envSpecificParameters } = await updateStateFiles(context, questionParameters, answers, persistEnvParameters);

  if (printSuccessMessage) {
    printSuccess(answers.bucketName!);
  }

  return {
    envSpecificParameters,
  };
};

const printSuccess = (bucketName: string): void => {
  printer.info('');
  printer.info(`✅ S3 Bucket '${bucketName}' was successfully imported.`);
  printer.info('');
  printer.info('Next steps:');
  printer.info('- This resource can now be accessed from REST APIs (`amplify add api`) and Functions (`amplify add function`)');
  printer.info('- Use Amplify Libraries to add, upload, and download objects to your frontend app');
  printer.info('  - iOS: https://docs.amplify.aws/lib/storage/getting-started/q/platform/ios');
  printer.info('  - Android: https://docs.amplify.aws/lib/storage/getting-started/q/platform/android');
  printer.info('  - JavaScript: https://docs.amplify.aws/lib/storage/getting-started/q/platform/js');
};

const importServiceWalkthrough = async (
  context: $TSContext,
  providerName: string,
  providerUtils: ProviderUtils,
  previousResourceParameters: S3ResourceParameters | undefined,
): Promise<{ questionParameters: S3ImportParameters; answers: S3ImportAnswers } | undefined> => {
  await ensureAuth(context);

  const authResources = (await context.amplify.getResourceStatus('auth')).allResources.filter(
    (r: { service: string }) => r.service === 'Cognito',
  );

  if (authResources.length === 0) {
    throw new Error('No auth resource found. Please add it using amplify add auth');
  }

  const s3 = await providerUtils.createS3Service(context);

  // Get list of user pools to see if there is anything to import
  const bucketList = await s3.listBuckets();

  // Return if no User Pools found in the project's region
  if (_.isEmpty(bucketList)) {
    printer.info(importMessages.NoS3BucketsToImport);
    return undefined;
  }

  const questionParameters: S3ImportParameters = createParameters(providerName, bucketList);

  const projectConfig = context.amplify.getProjectConfig();
  const [shortId] = uuid().split('-');
  const projectName = projectConfig.projectName.toLowerCase().replace(/[^A-Za-z0-9_]+/g, '_');

  const defaultAnswers: S3ImportAnswers = {
    resourceName: previousResourceParameters?.resourceName || `${projectName}${shortId}`,
  };

  const answers: S3ImportAnswers = { ...defaultAnswers };

  const enquirer = new Enquirer<S3ImportAnswers>(undefined, defaultAnswers);

  if (bucketList.length === 1) {
    answers.bucketName = bucketList[0].Name!;

    printer.info(importMessages.OneBucket(answers.bucketName));
  } else {
    const bucketNameList = bucketList.map((b) => b.Name!);

    const bucketNameQuestion = {
      type: 'autocomplete',
      name: 'bucketName',
      message: importMessages.BucketSelection,
      required: true,
      choices: bucketNameList,
      limit: 5,
      footer: importMessages.AutoCompleteFooter,
    };

    // any case needed because async validation TS definition is not up to date
    const { bucketName } = await enquirer.prompt(bucketNameQuestion as $TSAny);

    answers.bucketName = bucketName;
  }

  // Save the region as we need to store it in resource parameters
  questionParameters.region = await s3.getBucketLocation(answers.bucketName!);

  return {
    questionParameters,
    answers,
  };
};

const ensureAuth = async (context: $TSContext): Promise<void> => {
  while (!checkIfAuthExists()) {
    const addOrImportQuestion = {
      type: 'select',
      name: 'addOrImport',
      message: 'Do you want to add or import auth now?',
      required: true,
      choices: [
        {
          message: 'Add auth',
          value: 'add',
        },
        {
          message: 'Import auth',
          value: 'import',
        },
        {
          message: 'Cancel import storage',
          value: 'cancel',
        },
      ],
      header: 'You need to add auth (Amazon Cognito) to your project in order to add storage for user files.',
    };

    // any case needed because async validation TS definition is not up to date
    const addOrImportAnswer: { addOrImport: 'add' | 'import' | 'cancel' } = await Enquirer.prompt(addOrImportQuestion as $TSAny);

    if (addOrImportAnswer.addOrImport === 'cancel') {
      printer.info('');
      await context.usageData.emitSuccess();
      exitOnNextTick(0);
    } else {
      try {
        if (addOrImportAnswer.addOrImport === 'add') {
          await context.amplify.invokePluginMethod(context, 'auth', undefined, 'add', [context]);
        } else {
          await context.amplify.invokePluginMethod(context, 'auth', undefined, 'importAuth', [context]);
        }
      } catch (e) {
        printer.error('The Auth plugin is not installed in the CLI. You need to install it to use this feature');
        await context.usageData.emitError(e);
        exitOnNextTick(1);
      }
    }
  }
};

const createParameters = (providerName: string, bucketList: Bucket[]): S3ImportParameters => {
  const questionParameters: S3ImportParameters = {
    providerName,
    bucketList,
  };

  return questionParameters;
};

/**
 * Update storage state files
 */
export const updateStateFiles = async (
  context: $TSContext,
  questionParameters: S3ImportParameters,
  answers: S3ImportAnswers,
  updateEnvSpecificParameters: boolean,
): Promise<{
  backendConfiguration: S3BackendConfiguration;
  resourceParameters: S3ResourceParameters;
  metaConfiguration: S3MetaConfiguration;
  envSpecificParameters: S3EnvSpecificResourceParameters;
}> => {
  const backendConfiguration: S3BackendConfiguration = {
    service: 'S3',
    serviceType: 'imported',
    providerPlugin: questionParameters.providerName,
    dependsOn: [],
  };

  // Create and persist parameters
  const resourceParameters: S3ResourceParameters = {
    resourceName: answers.resourceName!,
    serviceType: 'imported',
  };

  stateManager.setResourceParametersJson(undefined, 'storage', answers.resourceName!, resourceParameters);

  // Add resource data to amplify-meta file and backend-config, since backend-config requires less information
  // we have to do a separate update to it without duplicating the methods
  const metaConfiguration = _.clone(backendConfiguration) as S3MetaConfiguration;
  metaConfiguration.output = createMetaOutput(answers, questionParameters);

  context.amplify.updateamplifyMetaAfterResourceAdd('storage', answers.resourceName!, metaConfiguration, backendConfiguration, true);

  // Update team provider-info
  const envSpecificParameters: S3EnvSpecificResourceParameters = createEnvSpecificResourceParameters(answers, questionParameters);

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

const createMetaOutput = (answers: S3ImportAnswers, questionParameters: S3ImportParameters): S3MetaOutput => {
  const output: S3MetaOutput = {
    BucketName: answers.bucketName,
    Region: questionParameters.region,
  };

  return output;
};

const createEnvSpecificResourceParameters = (
  answers: S3ImportAnswers,
  questionParameters: S3ImportParameters,
): S3EnvSpecificResourceParameters => {
  const envSpecificResourceParameters: S3EnvSpecificResourceParameters = {
    bucketName: answers.bucketName!,
    region: questionParameters.region!,
  };

  return envSpecificResourceParameters;
};

/**
 * initialize environment with imported s3 bucket
 */
export const importedS3EnvInit = async (
  context: $TSContext,
  resourceName: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  resource: S3MetaConfiguration,
  resourceParameters: S3ResourceParameters,
  providerName: string,
  providerUtils: ProviderUtils,
  currentEnvSpecificParameters: S3EnvSpecificResourceParameters,
  isInHeadlessMode: boolean,
  headlessParams: ImportS3HeadlessParameters,
): Promise<{ doServiceWalkthrough?: boolean; succeeded?: boolean; envSpecificParameters?: S3EnvSpecificResourceParameters }> => {
  const s3 = await providerUtils.createS3Service(context);
  const isPulling = context.input.command === 'pull' || (context.input.command === 'env' && context.input.subCommands?.[0] === 'pull');
  const isEnvAdd = context.input.command === 'env' && context.input.subCommands?.[0] === 'add';

  if (isInHeadlessMode) {
    // Validate required parameters' presence and merge into parameters
    return headlessImport(context, s3, providerName, resourceParameters, headlessParams, currentEnvSpecificParameters);
  }

  // If we are pulling, take the current values if present to skip unneeded service walkthrough
  if (isPulling) {
    const currentMeta = stateManager.getCurrentMeta(undefined, {
      throwIfNotExist: false,
    });

    if (currentMeta) {
      const currentResource = _.get(currentMeta, ['storage', resourceName], undefined);

      if (currentResource && currentResource.output) {
        const { BucketName, Region } = currentResource.output;

        /* eslint-disable no-param-reassign */
        currentEnvSpecificParameters.bucketName = BucketName;
        currentEnvSpecificParameters.region = Region;
        /* eslint-enable */
      }
    }
  } else if (isEnvAdd && context.exeInfo.sourceEnvName) {
    // Check to see if we have a source environment set (in case of env add), and ask customer if the want to import the same resource
    // from the existing environment or import a different one. Check if all the values are having some value that can be validated and
    // if not fall back to full service walkthrough.
    const resourceParamManager = (await ensureEnvParamManager(context.exeInfo.sourceEnvName)).instance.getResourceParamManager(
      'storage',
      resourceName,
    );

    if (resourceParamManager.hasAnyParams()) {
      const { importExisting } = await Enquirer.prompt<{ importExisting: boolean }>({
        name: 'importExisting',
        type: 'confirm',
        message: importMessages.ImportPreviousBucket(
          resourceName,
          resourceParamManager.getParam('bucketName')!,
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
      currentEnvSpecificParameters.bucketName = resourceParamManager.getParam('bucketName')!;
      currentEnvSpecificParameters.region = resourceParamManager.getParam('region')!;
      /* eslint-enable */
    }
  }

  // If there are no current parameters a service walkthrough is required, it can happen when pulling to an empty directory.
  if (!(currentEnvSpecificParameters.bucketName && currentEnvSpecificParameters.region)) {
    printer.info(importMessages.ImportNewResourceRequired(resourceName));

    return {
      doServiceWalkthrough: true,
    };
  }

  // Validate the parameters, generate the missing ones and import the resource.
  const questionParameters: S3ImportParameters = {
    providerName,
    bucketList: [],
  };

  const answers: S3ImportAnswers = {
    resourceName: resourceParameters.resourceName,
    bucketName: currentEnvSpecificParameters.bucketName,
  };

  const bucketExists = await s3.bucketExists(currentEnvSpecificParameters.bucketName);

  if (!bucketExists) {
    printer.error(importMessages.BucketNotFound(currentEnvSpecificParameters.bucketName));

    return {
      succeeded: false,
    };
  }

  // Save the region as we need to store it in resource parameters
  questionParameters.region = await s3.getBucketLocation(answers.bucketName!);

  const newState = await updateStateFiles(context, questionParameters, answers, false);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

const headlessImport = async (
  context: $TSContext,
  s3: IS3Service,
  providerName: string,
  resourceParameters: S3ResourceParameters,
  headlessParams: ImportS3HeadlessParameters,
  currentEnvSpecificParameters: S3EnvSpecificResourceParameters,
): Promise<{ succeeded: boolean; envSpecificParameters: S3EnvSpecificResourceParameters }> => {
  // Validate required parameters' presence and merge into parameters
  const resolvedEnvParams =
    headlessParams?.bucketName || headlessParams?.region ? ensureHeadlessParameters(headlessParams) : currentEnvSpecificParameters;

  // Validate the parameters, generate the missing ones and import the resource.
  const questionParameters: S3ImportParameters = {
    providerName,
    bucketList: [],
  };

  const answers: S3ImportAnswers = {
    resourceName: resourceParameters.resourceName,
    bucketName: resolvedEnvParams.bucketName,
  };

  const bucketExists = await s3.bucketExists(resolvedEnvParams.bucketName);

  if (!bucketExists) {
    throw new AmplifyError('StorageImportError', { message: importMessages.BucketNotFound(resolvedEnvParams.bucketName) });
  }

  // Save the region as we need to store it in resource parameters
  questionParameters.region = await s3.getBucketLocation(answers.bucketName!);

  const newState = await updateStateFiles(context, questionParameters, answers, false);

  return {
    succeeded: true,
    envSpecificParameters: newState.envSpecificParameters,
  };
};

export const ensureHeadlessParameters = (headlessParams: ImportS3HeadlessParameters): S3EnvSpecificResourceParameters => {
  // If we are doing headless mode, validate parameter presence and overwrite the input values from env specific params since they can be
  // different for the current env operation (eg region can mismatch)

  // Validate required arguments to be present
  const missingParams = [];

  if (!headlessParams.bucketName) {
    missingParams.push('bucketName');
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

  const envSpecificParameters: S3EnvSpecificResourceParameters = {
    bucketName: headlessParams.bucketName,
    region: headlessParams.region,
  };

  return envSpecificParameters;
};
