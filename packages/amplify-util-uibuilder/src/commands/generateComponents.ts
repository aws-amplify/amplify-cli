/* eslint-disable spellcheck/spell-checker */
import ora from 'ora';
import { printer } from '@aws-amplify/amplify-prompts';
import { $TSContext } from '@aws-amplify/amplify-cli-core';
import { AmplifyStudioClient } from '../clients';
import {
  notifyMissingPackages,
  shouldRenderComponents,
  getAmplifyDataSchema,
  deleteDetachedForms,
  getUiBuilderComponentsPath,
  extractUIComponents,
  mapGenericDataSchemaToCodegen,
  pollCodegenJob,
  hasStorageField,
  isFormDetachedFromModel,
} from './utils';

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

    const nothingWouldAutogenerate = !dataSchema || !studioClient.metadata.autoGenerateForms || !studioClient.isGraphQLSupported;

    if (nothingWouldAutogenerate && [componentSchemas, themeSchemas, formSchemas].every((group) => !group.entities.length)) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }
    spinner.start('Generating UI service...');
    
    const genericDataSchema = dataSchema ? mapGenericDataSchemaToCodegen(dataSchema) : undefined
    printer.debug(JSON.stringify(genericDataSchema));
    printer.debug('starting job');
    const jobId = await studioClient.startCodegenJob({
      renderConfig: {
        react: {
          module: 'es2020',
          target: 'es2020',
          script: 'jsx',
          renderTypeDeclarations: true
        }
      },
      genericDataSchema,
      autoGenerateForms: studioClient.metadata.autoGenerateForms && studioClient.isGraphQLSupported,
      features: studioClient.metadata.formFeatureFlags
    });

    // Poll till finished
    printer.debug('polling');
    const finishedJob = await pollCodegenJob(jobId, studioClient.getCodegenJob);

    // Extract
    printer.debug('extracting');
    const uiBuilderComponentsPath = getUiBuilderComponentsPath(context);
    if (!finishedJob.asset?.downloadUrl) {
      throw new Error('No asset in codegen job');
    }
    extractUIComponents(finishedJob.asset?.downloadUrl, uiBuilderComponentsPath);
    printer.debug('extracting finished');

    const detachedForms: { id: string; name: string }[] = [];
    
    const failedResponseNames: string[] = [];
    const modelNames = dataSchema?.models ? new Set(Object.keys(dataSchema.models)) : new Set<string>();

    // hasStorage
    const hasStorageManagerField = formSchemas.entities.some(formSchema => hasStorageField(formSchema));
    // Find detached forms
    if (dataSchema && eventType === 'PostPush') {
      formSchemas.entities.forEach(formSchema => {
        isFormDetachedFromModel(formSchema, modelNames) && detachedForms.push({id: formSchema.id, name: formSchema.name});
      });
    }

    if (finishedJob.statusMessage) {
      const errorStack = JSON.parse(finishedJob.statusMessage)?.codegenErrors as {
        id: string;
        schemaName: string;
        error: string;
        schemaVersion: string;
      }[];
      errorStack.forEach(e => failedResponseNames.push(e.schemaName));
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

    printer.debug('notify missing packages')
    notifyMissingPackages(context, hasStorageManagerField);
    
    printer.debug('delete detached forms')
    await deleteDetachedForms(detachedForms, studioClient);
  } catch (e) {
    printer.debug(e.message);
    spinner.fail('Failed to sync UI components');
  }
};
