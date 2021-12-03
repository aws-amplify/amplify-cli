const { printer } = require('amplify-prompts');

async function run(context) {
  try {
    await context.amplify.invokePluginMethod(context, 'ui-builder', undefined, 'executeAmplifyCommand', [context, 'generateComponents']);
  } catch (e) {
    // Swallow all errors from the uibuilder plugin
    printer.debug(e);
  }
}

module.exports = {
  run,
};
