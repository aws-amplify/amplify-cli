function getCategoryPlugins(context) {
  const categoryPlugins = [];

  context.runtime.plugins.forEach(plugin => {
    if (plugin.pluginType === 'category') {
      categoryPlugins.push(plugin.pluginName);
    }
  });
  return categoryPlugins;
}

function listCategories(context) {
  const categoryPlugins = getCategoryPlugins(context);
  const { table } = context.print;
  const tableOptions = [['Category']];
  for (let i = 0; i < categoryPlugins.length; i += 1) {
    tableOptions.push([categoryPlugins[i]]);
  }
  table(tableOptions, { format: 'markdown' });
}

module.exports = {
  listCategories,
};
