const logger = require('../commands/utils/logger');

async function run(context) {
  try {
    await context.amplify.invokePluginMethod(context, 'ui-builder', undefined, 'executeAmplifyCommand', [
      context,
      'cloneComponentsFromEnv',
    ]);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    logger.error(e);
  }
}

module.exports = {
  run,
};
