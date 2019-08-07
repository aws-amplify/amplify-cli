const {invokeWalkthroughRun} = require('amplify-category-function');
module.exports = {
  name: 'function',
  run: async function(context) {
    if (context.parameters.options.help) {
      const header = `amplify mock ${this.name} \nDescriptions:
      Mock Functions locally`
      context.amplify.showHelp(header, []);
      return;
    }
    try {
      await invokeWalkthroughRun(context);
    } catch(e) {
      context.print.error(e.message);
    }
  }
}
