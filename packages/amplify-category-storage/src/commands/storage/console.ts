
import { AmplifyCategories, CLISubCommands} from 'amplify-cli-core';

module.exports = {
  name: CLISubCommands.CONSOLE,
  run: async (context: any) => {
    context.print.info(`to be implemented: ${AmplifyCategories.STORAGE} ${CLISubCommands.CONSOLE}`);
  },
};
