import { run as runHelp } from './interactions/help';

const featureName = 'interactions';

module.exports = {
  name: featureName,
  run: async context => {
    if (context.parameters.options.help) {
      runHelp(context);
    }
  },
};
