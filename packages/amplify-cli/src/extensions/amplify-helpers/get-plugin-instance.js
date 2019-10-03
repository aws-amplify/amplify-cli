function getPluginInstance(context, pluginName) {
  let result;
  let pluginInfo;
  if (context.pluginPlatform.plugins[pluginName] && context.pluginPlatform.plugins[pluginName].length > 0) {
    /* eslint-disable */
    pluginInfo = context.pluginPlatform.plugins[pluginName][0];
    /* eslint-enable */
  }

  if (pluginInfo) {
    result = require(pluginInfo.packageLocation);
  }

  return result;
}

module.exports = {
  getPluginInstance,
};
