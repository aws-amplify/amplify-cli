const testUtil = require('../../lib');
module.exports = {
  name: 'api',
  run: async function(context) {
    if (context.parameters.options.help) {
      const header = `amplify mock ${this.name} \nDescription:
      Test GraphQL API locally`
      context.amplify.showHelp(header, []);
      return;
    }
    try {
      await testUtil.api.start(context);
    } catch(e) {
      context.print.error(e.message);
    }
  }
}