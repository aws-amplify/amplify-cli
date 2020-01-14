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

// entry from commandline
export async function run(): Promise<number> {
  try {
    let pluginPlatform = await getPluginPlatform();
    let input = getCommandLineInput(pluginPlatform);
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

    const context = constructContext(pluginPlatform, input);
    await checkProjectConfigVersion(context);
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
