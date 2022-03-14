import { notifyMissingPackages } from './utils/notifyMissingPackages';
import { shouldRenderComponents } from './utils/shouldRenderComponents';
import {
  listUiBuilderComponents,
  listUiBuilderThemes,
  generateUiBuilderComponents,
  generateUiBuilderThemes,
} from './utils/syncAmplifyUiBuilderComponents';
import { StudioComponent as StudioComponentNew } from '@aws-amplify/codegen-ui-new';
import { generateAmplifyUiBuilderIndexFile } from './utils/createUiBuilderComponent';
import { printer } from 'amplify-prompts';
import ora from 'ora';
import { $TSContext } from 'amplify-cli-core';

export async function run(context: $TSContext) {
  printer.debug('Running generate components command in amplify-util-uibuilder');
  if (!(await shouldRenderComponents(context))) {
    return;
  }
  const spinner = ora('');
  try {
    const [componentSchemas, themeSchemas] = await Promise.all([listUiBuilderComponents(context), listUiBuilderThemes(context)]);
    if (componentSchemas.entities.length === 0 && themeSchemas.entities.length === 0) {
      printer.debug('Skipping UI component generation since none are found.');
      return;
    }

    spinner.start('Generating UI components...');
    const generatedComponentResults = generateUiBuilderComponents(context, componentSchemas.entities);
    const generatedThemeResults = generateUiBuilderThemes(context, themeSchemas.entities);

    generateAmplifyUiBuilderIndexFile(context, [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ component }) => component),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ theme }) => theme),
    ] as StudioComponentNew[]);

    const failedSchemas = [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'FAILURE').map(({ schemaName }) => schemaName),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'FAILURE').map(({ schemaName }) => schemaName),
    ];

    if (failedSchemas.length > 0) {
      spinner.fail(`Failed to sync the following components: ${failedSchemas.join(', ')}`);
    } else {
      spinner.succeed('Synced UI components.');
    }

    notifyMissingPackages(context, [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ component }) => component),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ theme }) => theme),
    ] as StudioComponentNew[]);
  } catch (e) {
    printer.debug(e);
    spinner.fail('Failed to sync UI components');
  }
}
