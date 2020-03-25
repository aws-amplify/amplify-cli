async function loadRuntimePlugin(context, pluginId) {
  const pluginMeta = context.pluginPlatform.plugins.functionRuntime.find(meta => meta.manifest.functionRuntime.pluginId === pluginId);
  if (!pluginMeta) {
    throw new Error(`Could not find runtime plugin with id [${pluginId}]`);
  }
  try {
    const plugin = await import(pluginMeta.packageLocation);
    return plugin.functionRuntimeContributorFactory(context);
  } catch (err) {
    throw new Error(`Could not load runtime plugin with id [${pluginId}]. Underlying error is ${err}`);
  }
}

module.exports = {
  loadRuntimePlugin,
};
