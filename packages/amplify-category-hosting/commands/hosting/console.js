const index = require('../../index');

module.exports = {
  name: 'console',
  run: async (context) => {
    context.exeInfo = context.amplify.getProjectDetails();
    return index.console(context);
  },
};
