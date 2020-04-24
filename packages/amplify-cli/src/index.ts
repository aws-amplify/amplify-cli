import * as path from 'path';
import { Input } from './domain/input';
import { getPluginPlatform, scan } from './plugin-manager';
import { getCommandLineInput, verifyInput } from './input-manager';
import { constructContext, persistContext } from './context-manager';
import { print } from './context-extensions';
import { executeCommand } from './execution-manager';
import { Context } from './domain/context';
import { constants } from './domain/constants';
import { checkProjectConfigVersion } from './project-config-version-check';
import { default as updateNotifier } from 'update-notifier';
const pkg = require('../package.json');
const notifier = updateNotifier({ pkg }); // defaults to 1 day interval

// Adjust defaultMaxListeners to make sure Inquirer will not fail under Windows because of the multiple subscriptions
// https://github.com/SBoudrias/Inquirer.js/issues/887
import { EventEmitter } from 'events';
import { rewireDeprecatedCommands } from './rewireDeprecatedCommands';
EventEmitter.defaultMaxListeners = 1000;

// entry from commandline
export async function run(): Promise<number> {
  try {
    let pluginPlatform = await getPluginPlatform();
    let input = getCommandLineInput(pluginPlatform);
    // with non-help command supplied, give notification before execution
    if (input.command !== 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notifier.notify({ defer: false, isGlobal: true });
    }
    let verificationResult = verifyInput(pluginPlatform, input);

    // invalid input might be because plugin platform might have been updated,
    // scan and try again
    if (!verificationResult.verified) {
      if (verificationResult.message) {
        print.warning(verificationResult.message);
      }
      pluginPlatform = await scan();
      input = getCommandLineInput(pluginPlatform);
      verificationResult = verifyInput(pluginPlatform, input);
    }

    if (!verificationResult.verified) {
      if (verificationResult.helpCommandAvailable) {
        input.command = constants.HELP;
      } else {
        throw new Error(verificationResult.message);
      }
    }

    rewireDeprecatedCommands(input);
    const context = constructContext(pluginPlatform, input);
    await checkProjectConfigVersion(context);
    await executeCommand(context);
    persistContext(context);
    // no command supplied defaults to help, give update notification at end of execution
    if (input.command === 'help') {
      // Checks for available update, defaults to a 1 day interval for notification
      notifier.notify({ defer: true, isGlobal: true });
    }
    return 0;
  } catch (e) {
    // ToDo: add logging to the core, and log execution errors using the unified core logging.
    if (e.message) {
      print.error(e.message);
    }
    if (e.stack) {
      print.info(e.stack);
    }
    return 1;
  }
}

// entry from library call
export async function execute(input: Input) {
  try {
    let pluginPlatform = await getPluginPlatform();
    let verificationResult = verifyInput(pluginPlatform, input);

    if (!verificationResult.verified) {
      if (verificationResult.message) {
        print.warning(verificationResult.message);
      }
      pluginPlatform = await scan();
      verificationResult = verifyInput(pluginPlatform, input);
    }

    if (!verificationResult.verified) {
      if (verificationResult.helpCommandAvailable) {
        input.command = constants.HELP;
      } else {
        throw new Error(verificationResult.message);
      }
    }

    const context = constructContext(pluginPlatform, input);
    await executeCommand(context);
    persistContext(context);
    return 0;
  } catch (e) {
    // ToDo: add logging to the core, and log execution errors using the unified core logging.
    if (e.message) {
      print.error(e.message);
    }
    if (e.stack) {
      print.info(e.stack);
    }
    return 1;
  }
}

export async function executeAmplifyCommand(context: Context) {
  const commandPath = path.normalize(path.join(__dirname, 'commands', context.input.command!));
  const commandModule = require(commandPath);
  await commandModule.run(context);
}
