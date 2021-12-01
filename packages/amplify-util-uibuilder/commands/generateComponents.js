const { notifyMissingPackages } = require('./utils/notifyMissingPackages');
const { shouldRenderComponents } = require('./utils/shouldRenderComponents');
const {
  listUiBuilderComponents,
  listUiBuilderThemes,
  generateUiBuilderComponents,
  generateUiBuilderThemes,
} = require('./utils/syncAmplifyUiBuilderComponents');
const { generateAmplifyUiBuilderIndexFile } = require('./utils/createUiBuilderComponent');
const logger = require('./utils/logger');
const ora = require('ora');
async function run(context) {
  logger.info('Running generate components command in amplify-category-uibuilder');
  if (!(await shouldRenderComponents(context))) {
    return;
  }
  const spinner = ora('');
  try {
    const [componentSchemas, themeSchemas] = await Promise.all([listUiBuilderComponents(context), listUiBuilderThemes(context)]);
    if (componentSchemas.entities.length === 0 && themeSchemas.entities.length === 0) {
      logger.info('Skipping UI component generation since none are found.');
      return;
    }

    spinner.start('Generating UI components...');
    const generatedComponentResults = generateUiBuilderComponents(context, componentSchemas.entities);
    const generatedThemeResults = generateUiBuilderThemes(context, themeSchemas.entities);

    generateAmplifyUiBuilderIndexFile(context, [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ component }) => component),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'SUCCESS').map(({ theme }) => theme),
    ]);

    const failedSchemas = [
      ...generatedComponentResults.filter(({ resultType }) => resultType === 'FAILURE').map(({ schemaName }) => schemaName),
      ...generatedThemeResults.filter(({ resultType }) => resultType === 'FAILURE').map(({ schemaName }) => schemaName),
    ];

    if (failedSchemas.length > 0) {
      spinner.fail(`Failed to sync the following components: ${failedSchemas.join(', ')}`);
    } else {
      spinner.succeed('Synced UI components.');
    }
  } catch (e) {
    logger.error(e);
    spinner.fail('Failed to sync UI components');
  }

  notifyMissingPackages(context);
}

module.exports = {
  run,
};
