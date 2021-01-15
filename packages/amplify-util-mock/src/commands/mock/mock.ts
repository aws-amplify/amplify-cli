import { mockAllCategories } from '../../mockAll';
import { run as runHelp } from './help';

module.exports = {
  name: 'mock',
  run: async function (context) {
    if (context.parameters.options.help) {
      return runHelp(context);
    }
    mockAllCategories(context);
  },
};
