function getPluginInstance(context, pluginName) {
  const { plugins } = context.runtime;
  const pluginObj = plugins.find((plugin) => {
    // TODO: Change the way plugins are detected
    const nameSplit = plugin.name.split('-');
    return (nameSplit[nameSplit.length - 1] === pluginName);
  });
  if (pluginObj) {
    return require(pluginObj.directory);
  }
}

module.exports = {
  getPluginInstance,
};
