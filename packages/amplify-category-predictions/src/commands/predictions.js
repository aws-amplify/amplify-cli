import { run as runHelp } from './predictions/help';

const categoryName = 'predictions';

module.exports = {
  name: categoryName,
  alias: ['Predictions'],
  run: async context => {
    if (context.parameters.options.help) {
      runHelp(context);
    }
  },
};
