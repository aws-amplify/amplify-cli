const subcommand = 'console';
const category = 'storage';

module.exports = {
  name: subcommand,
  run: async context => {
    context.print.info(`to be implemented: ${category} ${subcommand}`);
  },
};
