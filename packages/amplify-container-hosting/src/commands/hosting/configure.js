const index = require('../../index');

module.exports = {
  name: 'configure',
  alias: ['update'],
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    return index.configure(context);
  },
};
