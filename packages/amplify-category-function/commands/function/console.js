const subcommand = 'console';
const category = 'function';

module.exports = {
  name: subcommand,
  run: async context => {
    context.print.info(`to be implemented: ${category} ${subcommand}`);
  },
};
