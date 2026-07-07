import { categoryName } from '../constants';
import { run as runHelp } from './function/help';

module.exports = {
  name: categoryName,
  run: async (context): Promise<void> => {
    if (context.parameters.options.help) {
      runHelp(context);
      return;
    }
    if (/^win/.test(process.platform)) {
      try {
        const { run } = require(`./${categoryName}/${context.parameters.first}`);
        run(context);
        return;
      } catch (e) {
        context.print.error('Command not found');
      }
    }
  },
};
