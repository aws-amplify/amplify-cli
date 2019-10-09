import path from 'path';
import { Context } from '../../domain/context';
import { constants } from '../../domain/constants';
import { createNewPlugin } from '../../plugin-manager';
import { addUserPluginPackage } from '../../plugin-manager';
import { AddPluginError } from '../../domain/add-plugin-result';

export async function run(context: Context) {
  const pluginDirPath = await createNewPlugin(context, process.cwd());
  if (pluginDirPath) {
    const isPluggedInLocalAmplifyCLI = await plugIntoLocalAmplifyCli(context, pluginDirPath);
    printInfo(context, pluginDirPath, isPluggedInLocalAmplifyCLI);
  }
}

async function plugIntoLocalAmplifyCli(context: Context, pluginDirPath: string): Promise<boolean> {
  let isPluggedIn = false;

  const addPluginResult = addUserPluginPackage(context.pluginPlatform, pluginDirPath);
  if (addPluginResult.isAdded) {
    isPluggedIn = true;
  } else {
    context.print.error('Failed to add the plugin package to the local Amplify CLI.');
    context.print.info(`Error code: ${addPluginResult.error}`);
    if (
      addPluginResult.error === AddPluginError.FailedVerification &&
      addPluginResult.pluginVerificationResult &&
      addPluginResult.pluginVerificationResult.error
    ) {
      const { error } = addPluginResult.pluginVerificationResult;
      context.print.info(`Plugin verification error code: \ ${error}`);
    }
  }

  return isPluggedIn;
}

// async function plugIntoLocalAmplifyCli(context: Context, pluginDirPath: string):
// Promise<boolean> {
//   let isPluggedIn = false;

//   const yesFlag = context.input.options && context.input.options[Constant.YES];

//   let ifPlugIntoLocalAmplifyCLI = true;

//   if (!yesFlag) {
//     context.print.info('The package can be plugged into the local Amplify CLI \
// for testing during development.');
//     const plugQuestion = {
//       type: 'confirm',
//       name: 'ifPlugIntoLocalAmplifyCLI',
//       message: 'Do you want this package plugged into the local Amplify CLI',
//       default: ifPlugIntoLocalAmplifyCLI,
//     };
//     const answer = await inquirer.prompt(plugQuestion);
//     ifPlugIntoLocalAmplifyCLI = answer.ifPlugIntoLocalAmplifyCLI;
//   }

//   if (ifPlugIntoLocalAmplifyCLI) {
//     const addPluginResult = addUserPluginPackage(context.pluginPlatform, pluginDirPath);
//     if (addPluginResult.isAdded) {
//       isPluggedIn = true;
//       await confirmAndScan(context.pluginPlatform);
//     } else {
//       context.print.error('Failed to add the plugin package.');
//       context.print.info(`Error code: ${addPluginResult.error}`);
//       if (addPluginResult.error === AddPluginError.FailedVerification &&
//                 addPluginResult.pluginVerificationResult &&
//                 addPluginResult.pluginVerificationResult.error) {
//         context.print.info(`Plugin verification error code: \
// ${addPluginResult.pluginVerificationResult.error}`);
//       }
//     }
//   }
//   return isPluggedIn;
// }

function printInfo(context: Context, pluginDirPath: string, isPluggedInLocalAmplifyCLI: boolean) {
  context.print.info('');
  context.print.info(`The plugin package ${path.basename(pluginDirPath)} \
    has been successfully setup.`);
  context.print.info('Next steps:');

  if (!isPluggedInLocalAmplifyCLI) {
    context.print.info(`$ amplify plugin add: add the plugin into the local Amplify CLI for testing.`);
  }

  const amplifyPluginJsonFilePath = path.normalize(path.join(pluginDirPath, constants.MANIFEST_FILE_NAME));
  const commandsDirPath = path.normalize(path.join(pluginDirPath, 'commands'));
  const eventHandlerDirPath = path.normalize(path.join(pluginDirPath, 'event-handlers'));

  context.print.info('');
  context.print.info('To add/remove command:');
  context.print.info('1. Add/remove the command name in the commands array in amplify-plugin.json.');
  context.print.green(amplifyPluginJsonFilePath);
  context.print.info('2. Add/remove the command code file in the commands folder.');
  context.print.green(commandsDirPath);

  context.print.info('');
  context.print.info('To add/remove eventHandlers:');
  context.print.info('1. Add/remove the event name in the eventHandlers array in amplify-plugin.json.');
  context.print.green(amplifyPluginJsonFilePath);
  context.print.info('2. Add/remove the event handler code file into the event-handler folder.');
  context.print.green(eventHandlerDirPath);
  context.print.info('');
}
