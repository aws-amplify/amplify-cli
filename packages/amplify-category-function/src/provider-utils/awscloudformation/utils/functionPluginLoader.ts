import inquirer from 'inquirer'
import { FunctionParameters } from "amplify-function-plugin-interface";
import _ from 'lodash';

/*
 * This file contains the logic for loading, selecting and executing function plugins (currently runtime and template plugins)
 */

 /**
  * Loads function template plugins
  * @param context Amplify Context object
  * @param params Current function parameters
  * @returns FunctionParameters populated with the values required to build the supplied template
  */
export async function templateWalkthrough(context: any, params: FunctionParameters): Promise<FunctionParameters> {
  const pluginType = 'function-template-provider';
  const selectionItem = 'template';
  return await loadParametersFromPluginType(context, params, pluginType, selectionItem);
}

/**
 * Loads function runtime plugins
 * @param context Amplify Context object
 * @param params Current function parameters
 * @returns FunctionParameters populated with the value required to build the supplied runtime
 */
export async function runtimeWalkthrough(context: any, params: FunctionParameters): Promise<FunctionParameters> {
  const pluginType = 'function-runtime-provider';
  const selectionItem = 'runtime';
  return await loadParametersFromPluginType(context, params, pluginType, selectionItem);
}

/**
 * Handles dynamically requiring function plugins and executing the options exposed in the plugin
 * @param context Amplify Context object
 * @param params Current function parameters
 * @param pluginType The type of function plugin to load
 * @param itemName The name of the item that should be shown to the user
 */
async function loadParametersFromPluginType(context: any, params: FunctionParameters, pluginType: string, itemName: string): Promise<FunctionParameters> {
  // get providers from context
  const templateProviders = context.pluginPlatform.plugins[pluginType];
  if (!templateProviders) {
    throw 'No template plugins found. You can either create your function from scratch or download and install template plugins then rerun this command.'
  }

  const paramsCopy = _.assign({}, params) // copy params to pass to plugins so they cannot be modified

    // load the options from each provider
  const options = templateProviders
    .map(providerMeta => providerMeta.packageLocation)
    .map(packageLoc => {
        try {
          return require(packageLoc); // dynamic require each template provider
        } catch(err) {
          context.print.warning('Some plugins could not be loaded. Run "amplify plugin scan" to fix');
          return false;
        }
      }
    )
    .filter(provider => !!provider) // get rid of any cases above where we failed to load the plugin
    .flatMap(provider => provider.getOptions(context, paramsCopy)) // copy params so that plugin cannot modify them
    .map(op => {return {name: op.name, value: op.create}}); // the create function is set as the value of the selection

  // sanity checks
  if (options.length === 0) {
    context.print.warning(`No ${itemName} found for the selected function configuration`)
    context.print.warning(`You can download and install ${itemName} plugins then rerun this command`)
    return {};
  } else if (options.length === 1) {
    context.print.info(`${options[0].name} found for selected function configuration.`)
    return await options[0].value();
  }

  // ask which template to use
  const selection = await inquirer.prompt([{
    type: 'list',
    name: 'create',
    message: `Select the function ${itemName}:`,
    choices: options
  }]);

  // execute the template creation function associated with the selection
  return await selection.create();
}