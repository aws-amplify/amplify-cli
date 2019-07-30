const testUtil = require('../../lib');
module.exports = {
  name: 'storage',
  run: async function(context) {
    if (context.parameters.options.help) {
      const header = `amplify test ${this.name} \nDescriptions:
      Test Storage locally`
      context.amplify.showHelp(header, []);
      return;
    }
    try {
      await testUtil.storage.start(context);
    } catch(e) {
      context.print.error(e.message);
    }
  }
}