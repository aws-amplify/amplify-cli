const subcommand = 'console';
const category = 'auth';

module.exports = {
  name: subcommand,
  run: async (context) => {
      context.print.info('to be implemented: ' + category + ' ' + subcommand);
  },
};
