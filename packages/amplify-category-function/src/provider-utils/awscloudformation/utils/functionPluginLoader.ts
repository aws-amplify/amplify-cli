import inquirer from 'inquirer';
import {
  FunctionParameters,
  FunctionTemplateCondition,
  FunctionRuntimeCondition,
  FunctionRuntimeParameters,
  FunctionTemplateParameters,
  Contributor,
  FunctionRuntimeLifecycleManager,
  ContributionRequest,
} from 'amplify-function-plugin-interface';
import _ from 'lodash';

/*
 * This file contains the logic for loading, selecting and executing function plugins (currently runtime and template plugins)
 */

/**
 * Selects a function template
 */
export async function templateWalkthrough(context: any, params: Partial<FunctionParameters>): Promise<FunctionTemplateParameters> {
  const selectionOptions: PluginSelectionOptions<FunctionTemplateCondition> = {
    pluginType: 'functionTemplate',
    listOptionsField: 'templates',
    predicate: condition => {
      return (
        condition.provider === params.providerContext.provider &&
        condition.service === params.providerContext.service &&
        (condition.runtime === params.runtime.value ||
          (Array.isArray(condition.runtime) && condition.runtime.includes(params.runtime.value)))
      );
    },
    selectionPrompt: 'Choose the function template that you want to use:',
    notFoundMessage: `No ${params.runtime.name} ${params.providerContext.service} templates found`,
  };
  const selection = await getSelectionFromContributors<FunctionTemplateCondition>(context, selectionOptions);
  const plugin = await loadPluginFromFactory(selection.pluginPath, 'functionTemplateContributorFactory', context);
  const contributionRequest: ContributionRequest = {
    selection: selection.value,
    contributionContext: {
      runtime: params.runtime,
      functionName: params.functionName,
      resourceName: params.resourceName,
    },
  };
  return await plugin.contribute(contributionRequest);
}

/**
 * Selects a function runtime
 */
export async function runtimeWalkthrough(
  context: any,
  params: Partial<FunctionParameters>,
): Promise<Pick<FunctionParameters, 'runtimePluginId'> & FunctionRuntimeParameters> {
  const selectionOptions: PluginSelectionOptions<FunctionRuntimeCondition> = {
    pluginType: 'functionRuntime',
    listOptionsField: 'runtimes',
    predicate: condition => {
      return condition.provider === params.providerContext.provider && condition.service === params.providerContext.service;
    },
    selectionPrompt: 'Choose the function runtime that you want to use:',
    notFoundMessage: `No runtimes found for provider ${params.providerContext.provider} and service ${params.providerContext.service}`,
  };
  const selection = await getSelectionFromContributors<FunctionRuntimeCondition>(context, selectionOptions);
  const plugin = await loadPluginFromFactory(selection.pluginPath, 'functionRuntimeContributorFactory', context);
  const depCheck = await (plugin as FunctionRuntimeLifecycleManager).checkDependencies(selection.value);
  if (!depCheck.hasRequiredDependencies) {
    context.print.warning(depCheck.errorMessage || 'Some dependencies required for building and packaging this runtime are not installed');
  }
  const contributionRequest: ContributionRequest = {
    selection: selection.value,
    contributionContext: {
      runtime: params.runtime,
      functionName: params.functionName,
      resourceName: params.resourceName,
    },
  };
  const contribution = await plugin.contribute(contributionRequest);
  return {
    ...contribution,
    runtimePluginId: selection.pluginId,
  };
}

/**
 * Parses plugin metadat to present plugin selections to the user and return the selection.
 */
async function getSelectionFromContributors<T>(context: any, selectionOptions: PluginSelectionOptions<T>): Promise<PluginSelection> {
  const notFoundSuffix = 'You can download and install additional plugins then rerun this command';
  // get providers from context
  const templateProviders = context.pluginPlatform.plugins[selectionOptions.pluginType];
  if (!templateProviders) {
    context.print.error(selectionOptions.notFoundMessage);
    context.print.error(notFoundSuffix);
    throw new Error('No plugins found for function configuration');
  }

  // load the selections contributed from each provider, constructing a map of selection to provider as we go
  const selectionMap: Map<string, { path: string; pluginId: string }> = new Map();
  const selections = templateProviders
    .filter(meta => selectionOptions.predicate(meta.manifest[selectionOptions.pluginType].conditions))
    .map(meta => {
      const packageLoc = meta.packageLocation;
      const pluginId = meta.manifest[selectionOptions.pluginType].pluginId;
      (meta.manifest[selectionOptions.pluginType][selectionOptions.listOptionsField] as ListOption[]).forEach(op => {
        selectionMap.set(op.value, { path: packageLoc, pluginId });
      });
      return meta;
    })
    .map(meta => meta.manifest[selectionOptions.pluginType])
    .map(contributes => contributes[selectionOptions.listOptionsField])
    .reduce((acc, it) => acc.concat(it), [])
    .sort((a, b) => a.name.localeCompare(b.name)); // sort by display name so that selections order is deterministic

  // sanity checks
  let selection;
  if (selections.length === 0) {
    context.print.error(selectionOptions.notFoundMessage);
    context.print.error(notFoundSuffix);
    throw new Error('Plugins found but no selections supplied for function configuration');
  } else if (selections.length === 1) {
    // quick hack to print custom messages for single selection options
    let singleOptionMsg = `Only one selection option found for ${selectionOptions.listOptionsField}. Using ${selections[0].name} by default`;
    if (selectionOptions.listOptionsField === 'templates') {
      singleOptionMsg = `Only one template found - using ${selections[0].name} by default.`;
    } else if (selectionOptions.listOptionsField === 'runtimes') {
      singleOptionMsg = `Only one runtime detected: ${selections[0].name}. Learn more about additional runtimes at https://docs.amplify.aws/cli/function`;
    }
    context.print.info(singleOptionMsg);
    selection = selections[0].value;
  } else {
    // ask which template to use
    let answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'selection',
        message: selectionOptions.selectionPrompt,
        choices: selections,
        default: selectionOptions.listOptionsField === 'runtimes' ? 'nodejs' : undefined,
      },
    ]);
    selection = answer.selection;
  }

  return {
    value: selection,
    pluginPath: selectionMap.get(selection).path,
    pluginId: selectionMap.get(selection).pluginId,
  };
}

export async function loadPluginFromFactory(pluginPath, expectedFactoryFunction, context): Promise<any> {
  let plugin;
  try {
    plugin = await import(pluginPath);
  } catch (err) {
    throw new Error('Could not load selected plugin');
  }
  if (!plugin) {
    throw new Error('Could not load selected plugin');
  }
  return plugin[expectedFactoryFunction](context);
}

// Convenience interfaces that are private to this class

interface PluginSelectionOptions<T extends FunctionRuntimeCondition | FunctionTemplateCondition> {
  pluginType: string;
  predicate: (condition: T) => boolean;
  listOptionsField: string;
  notFoundMessage: string;
  selectionPrompt: string;
}
interface PluginSelection {
  pluginPath: string;
  value: string;
  pluginId: string;
}

interface ListOption {
  name: string;
  value: string;
}
