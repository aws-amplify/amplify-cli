// @ts-expect-error ts-migrate(2451) FIXME: Cannot redeclare block-scoped variable 'subcommand... Remove this comment to see the full error message
const subcommand = 'console';
const indexModule = require('../../index');

module.exports = {
  name: subcommand,
  run: async (context: any) => {
    await indexModule.console(context);
  },
};
