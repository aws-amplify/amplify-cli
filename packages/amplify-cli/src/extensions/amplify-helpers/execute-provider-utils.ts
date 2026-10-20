import { $TSAny, $TSContext } from '@aws-amplify/amplify-cli-core';
import { getProviderPlugins } from './get-provider-plugins';

export async function executeProviderUtils(context: $TSContext, providerName: string, utilName: string, options?: $TSAny) {
  const providerPlugins = getProviderPlugins(context);
  // Use require() instead of dynamic import() to avoid ERR_VM_DYNAMIC_IMPORT_CALLBACK_MISSING
  // when running inside a pkg-bundled binary, where vm.Script does not set importModuleDynamically.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const pluginModule = require(providerPlugins[providerName]);
  return pluginModule.providerUtils[utilName](context, options);
}
