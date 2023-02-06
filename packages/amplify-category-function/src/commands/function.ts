import { categoryName } from '../constants';
import { run as runHelp } from './function/help';

module.exports = {
  name: categoryName,
  run: async context => {
    if (context.parameters.options.help) {
      return runHelp(context);
    }
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${categoryName}/${context.parameters.first}`);
        return run(context);
      } catch (e) {
        context.print.error('Command not found');
      }
    }
  },
};
