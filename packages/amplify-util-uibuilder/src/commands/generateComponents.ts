import { StudioComponent } from '@aws-amplify/codegen-ui';
import { printer } from 'amplify-prompts';
import ora from 'ora';
import { $TSContext } from 'amplify-cli-core';
import { notifyMissingPackages } from './utils/notifyMissingPackages';
import { shouldRenderComponents } from './utils/shouldRenderComponents';
import {
  listUiBuilderComponents,
  listUiBuilderThemes,
  generateUiBuilderComponents,
  generateUiBuilderThemes,
} from './utils/syncAmplifyUiBuilderComponents';
import { generateAmplifyUiBuilderIndexFile } from './utils/createUiBuilderComponent';
import { getAmplifyDataSchema } from './utils/getAmplifyDataSchema';
import { AmplifyClientFactory } from '../clients';

/**
 * Pulls ui components from Studio backend and generates the code in the user's file system
 */
export const run = async (context: $TSContext): Promise<void> => {
  printer.debug('Running generate components command in amplify-util-uibuilder');
  if (!(await shouldRenderComponents(context))) {
    return;
  }
  const spinner = ora('');
  try {
    await AmplifyClientFactory.setClientInfo(context);
    const [componentSchemas, themeSchemas, dataSchemaResponse] = await Promise.all([
      listUiBuilderComponents(context),
      listUiBuilderThemes(context),
      getAmplifyDataSchema(context),
    ]);
    if (componentSchemas.entities.length === 0 && themeSchemas.entities.length === 0) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }
    if (dataSchemaResponse.error) printer.debug(dataSchemaResponse.error.toString());

    spinner.start('Generating UI components...');
    const generatedComponentResults = generateUiBuilderComponents(context, componentSchemas.entities, dataSchemaResponse.dataSchema);
    const generatedThemeResults = generateUiBuilderThemes(context, themeSchemas.entities);

    generateAmplifyUiBuilderIndexFile(context, [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ component }) => component),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ theme }) => theme),
    ] as StudioComponent[]);

    const failedSchemas = [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'FAILURE').map(({ schemaName }) => schemaName),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'FAILURE').map(({ schemaName }) => schemaName),
    ];

    if (failedSchemas.length > 0) {
      spinner.fail(`Failed to sync the following components: ${failedSchemas.join(', ')}`);
    } else {
      spinner.succeed('Synced UI components.');
    }

    const invalidComponentNames = componentSchemas.entities.filter(component => !component.schemaVersion).map(component => component.name);
    if (invalidComponentNames.length) {
      printer.warn(
        `The components ${invalidComponentNames.join(
          ', ',
        )} were synced with an older version of Amplify Studio. Please re-sync your components with Figma to get latest features and changes.`, // eslint-disable-line spellcheck/spell-checker
      );
    }

    notifyMissingPackages(context);
  } catch (e) {
    printer.debug(e);
    spinner.fail('Failed to sync UI components');
  }
};
