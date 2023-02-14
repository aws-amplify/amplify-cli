/* eslint-disable spellcheck/spell-checker */
import { StudioSchema } from '@aws-amplify/codegen-ui';
import ora from 'ora';
import { printer } from 'amplify-prompts';
import { $TSContext } from 'amplify-cli-core';
import { AmplifyStudioClient } from '../clients';
import {
  notifyMissingPackages,
  shouldRenderComponents,
  generateUiBuilderComponents,
  generateUiBuilderThemes,
  getAmplifyDataSchema,
  generateAmplifyUiBuilderIndexFile,
  generateUiBuilderForms,
  generateAmplifyUiBuilderUtilFile,
  isStudioForm,
  isFormDetachedFromModel,
  deleteDetachedForms,
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
      getAmplifyDataSchema(studioClient),
    ]);

    const nothingWouldAutogenerate = !dataSchema || !studioClient.metadata.autoGenerateForms || !studioClient.isGraphQLSupported;

    if (nothingWouldAutogenerate && [componentSchemas, themeSchemas, formSchemas].every(group => !group.entities.length)) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }
    spinner.start('Generating UI components...');

    const generatedResults = {
      component: generateUiBuilderComponents(context, componentSchemas.entities, dataSchema),
      theme: generateUiBuilderThemes(context, themeSchemas.entities),
      form: generateUiBuilderForms(
        context,
        formSchemas.entities,
        dataSchema,
        studioClient.metadata.autoGenerateForms && studioClient.isGraphQLSupported,
      ),
    };

    const successfulSchemas: StudioSchema[] = [];
    const detachedForms: {id: string, name: string}[] = [];
    let hasSuccessfulForm = false;
    const failedResponseNames: string[] = [];
    const modelNames = dataSchema?.models ? new Set(Object.keys(dataSchema.models)) : new Set<string>();

    Object.entries(generatedResults).forEach(([key, results]) => {
      results.forEach(result => {
        if (result.resultType === 'SUCCESS') {
          successfulSchemas.push(result.schema);
          if (key === 'form') {
            hasSuccessfulForm = true;
          }
        } else {
          const failedSchema = result.schema;
          /**
           * A form resource may fail to generate because it's DataStore model type
           * no longer exists.
           */
          if (
            isStudioForm(failedSchema)
            && failedSchema.id
            && dataSchema
            && eventType === 'PostPush'
            && isFormDetachedFromModel(failedSchema, modelNames)
          ) {
            // Don't need to add form to failedResponseNames if it is going to be deleted
            detachedForms.push({id: failedSchema.id, name: failedSchema.name});
            return;
          }
          failedResponseNames.push(result.schemaName);
        }
      });
    });

    generateAmplifyUiBuilderIndexFile(context, successfulSchemas);

    generateAmplifyUiBuilderUtilFile(context, { hasForms: hasSuccessfulForm, hasViews: false });

    if (failedResponseNames.length > 0) {
      spinner.fail(`Failed to sync the following components: ${failedResponseNames.join(', ')}`);
    } else {
      spinner.succeed('Synced UI components.');
    }

    const invalidComponentNames = [
      ...componentSchemas.entities.filter(component => !component.schemaVersion).map(component => component.name),
      ...formSchemas.entities.filter(form => !form.schemaVersion).map(form => form.name),
    ];
    if (invalidComponentNames.length) {
      printer.warn(
        `The components ${invalidComponentNames.join(
          ', ',
        )} were synced with an older version of Amplify Studio. Please re-sync your components with Figma to get latest features and changes.`, // eslint-disable-line spellcheck/spell-checker
      );
    }

    notifyMissingPackages(context);

    await deleteDetachedForms(detachedForms, studioClient);
  } catch (e) {
    printer.debug(e);
    spinner.fail('Failed to sync UI components');
  }
};
