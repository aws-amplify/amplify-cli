function getCategoryPlugins(context) {
  const categoryPlugins = {};
  context.runtime.plugins.forEach((plugin) => {
    if (plugin.name.includes('category')) {
      const strs = plugin.name.split('-');
      const categoryName = strs[strs.length - 1];
      categoryPlugins[categoryName] = plugin.directory;
    }
  });
  return categoryPlugins;
}

module.exports = {
  getCategoryPlugins,
};
