const testUtil = require('../../lib');
const help = require('./help');

module.exports = {
  name: 'mock',
  run: async function(context) {
    if (context.parameters.options.help) {
      return help.run(context);
    }
    testUtil.mockAllCategories(context);
  }
}