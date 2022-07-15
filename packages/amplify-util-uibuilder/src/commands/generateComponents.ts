import { StudioComponent } from '@aws-amplify/codegen-ui';
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
} from './utils';

/**
 * Pulls ui components from Studio backend and generates the code in the user's file system
 */
export const run = async (context: $TSContext): Promise<void> => {
  if (!(await shouldRenderComponents(context))) {
    return;
  }
  const spinner = ora('');
  try {
    const studioClient = await AmplifyStudioClient.setClientInfo(context);
    const [componentSchemas, themeSchemas, dataSchema] = await Promise.all([
      studioClient.listComponents(),
      studioClient.listThemes(),
      getAmplifyDataSchema(studioClient),
    ]);
    if (componentSchemas.entities.length === 0 && themeSchemas.entities.length === 0) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }
    spinner.start('Generating UI components...');
    const generatedComponentResults = generateUiBuilderComponents(context, componentSchemas.entities, dataSchema);
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
