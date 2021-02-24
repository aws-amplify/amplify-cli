const index = require('../../index');

module.exports = {
  name: 'add',
  alias: ['enable'],
  run: async context => {
    context.exeInfo = context.amplify.getProjectDetails();
    return index.add(context).then(() => {
      context.print.info('');
      context.print.success('You can now publish your app using the following command:');
      context.print.info('Command: amplify publish');
      context.print.info('');
    });
  },
};
