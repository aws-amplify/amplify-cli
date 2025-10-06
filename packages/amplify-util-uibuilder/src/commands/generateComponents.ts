/* eslint-disable spellcheck/spell-checker */
import ora from 'ora';
import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyStudioClient } from '../clients';
import {
  notifyMissingPackages,
  shouldRenderComponents,
  getAmplifyDataSchema,
  isFormDetachedFromModel,
  deleteDetachedForms,
  hasStorageField,
  mapGenericDataSchemaToCodegen,
  waitForSucceededJob,
  extractUIComponents,
  parsePackageJsonFile,
  getStartCodegenJobDependencies,
} from './utils';
import { getUiBuilderComponentsPath } from './utils/getUiBuilderComponentsPath';
import type { ApiConfiguration, StartCodegenJobData, ReactStartCodegenJobData } from '@aws-sdk/client-amplifyuibuilder';
import { getApiConfiguration, hasDataStoreConfiguration, hasGraphQLConfiguration } from './utils/getApiConfiguration';

/**
 * Pulls ui components from Studio backend and generates the code in the user's file system
 */
export const run = async (context: $TSContext, eventType: 'PostPush' | 'PostPull'): Promise<void> => {
  if (!(await shouldRenderComponents(context))) {
    return;
  }
  const spinner = ora('');
  try {
    const studioClient = await AmplifyStudioClient.setClientInfo(context);
    const [componentSchemas, themeSchemas, formSchemas, dataSchema] = await Promise.all([
      studioClient.listComponents(),
      studioClient.listThemes(),
      studioClient.listForms(),
      studioClient.isGraphQLSupported ? getAmplifyDataSchema(context) : Promise.resolve(undefined),
    ]);

    const canGenerateDataComponents = dataSchema && studioClient.isGraphQLSupported;

    const apiConfiguration: ApiConfiguration = canGenerateDataComponents ? getApiConfiguration(studioClient, context) : { noApiConfig: {} };
    const hasDataAPI = hasDataStoreConfiguration(apiConfiguration) || hasGraphQLConfiguration(apiConfiguration);
    const willAutogenerateItems = canGenerateDataComponents && studioClient.metadata.autoGenerateForms && hasDataAPI;

    if (!willAutogenerateItems && [componentSchemas, themeSchemas, formSchemas].every((group) => !group.entities.length)) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }
    spinner.start('Generating UI components...');

    const genericDataSchema = dataSchema ? mapGenericDataSchemaToCodegen(dataSchema) : undefined;

    const packageJsonFile = parsePackageJsonFile(context);
    let startCodegenJobDependencies: { [key: string]: string } = {};
    if (packageJsonFile) {
      startCodegenJobDependencies = getStartCodegenJobDependencies(packageJsonFile);
    }
    const job: StartCodegenJobData = {
      renderConfig: {
        react: {
          module: 'es2020',
          target: 'es2020',
          script: 'jsx',
          renderTypeDeclarations: true,
          apiConfiguration,
          dependencies: startCodegenJobDependencies,
        } as ReactStartCodegenJobData,
      },
      autoGenerateForms: studioClient.metadata.autoGenerateForms && studioClient.isGraphQLSupported && hasDataAPI,
      features: studioClient.metadata.formFeatureFlags,
    };
    // SDK will throw if this is undefined
    // even though it's optional
    if (genericDataSchema) {
      job.genericDataSchema = genericDataSchema;
    }
    const jobId = await studioClient.startCodegenJob(job);
    const finishedJob = await waitForSucceededJob(() => studioClient.getCodegenJob(jobId), { pollInterval: 2000 });
    if (!finishedJob.asset?.downloadUrl) {
      throw new Error('No manifest file in codegen job');
    }
    const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
    await extractUIComponents(finishedJob.asset.downloadUrl, uiBuilderComponentsPath);

    const detachedForms: { id: string; name: string }[] = [];
    const failedResponseNames: string[] = [];
    const modelNames = dataSchema?.models ? new Set(Object.keys(dataSchema.models)) : new Set<string>();
    const hasStorageManagerField = formSchemas.entities.some((formSchema) => hasStorageField(formSchema));

    if (dataSchema && eventType === 'PostPush') {
      formSchemas.entities.forEach((formSchema) => {
        isFormDetachedFromModel(formSchema, modelNames) &&
          formSchema.id &&
          formSchema.name &&
          detachedForms.push({ id: formSchema.id, name: formSchema.name });
      });
    }

    if (finishedJob.statusMessage) {
      const errorStack = JSON.parse(finishedJob.statusMessage)?.codegenErrors as {
        schemaName: string;
        error: string;
      }[];
      errorStack.forEach((e) => failedResponseNames.push(e.schemaName));
    }

    if (failedResponseNames.length > 0) {
      spinner.fail(`Failed to sync the following components: ${failedResponseNames.join(', ')}`);
    } else {
      spinner.succeed('Synced UI components.');
    }

    const invalidComponentNames = [
      ...componentSchemas.entities.filter((component) => !component.schemaVersion).map((component) => component.name),
      ...formSchemas.entities.filter((form) => !form.schemaVersion).map((form) => form.name),
    ];

    if (invalidComponentNames.length) {
      printer.warn(
        `The components ${invalidComponentNames.join(
          ', ',
        )} were synced with an older version of Amplify Studio. Please re-sync your components with Figma to get latest features and changes.`, // eslint-disable-line spellcheck/spell-checker
      );
    }

    notifyMissingPackages(context, hasStorageManagerField, finishedJob.dependencies);

    await deleteDetachedForms(detachedForms, studioClient);
  } catch (e) {
    printer.debug(e);
    spinner.fail('Failed to sync UI components');
  }
};
