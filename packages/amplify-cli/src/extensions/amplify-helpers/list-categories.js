function listCategories(context) {
  const categoryPluginNames = Object.keys(context.amplify.getAllCategoryPluginInfo(context));
  const { table } = context.print;
  const tableOptions = [['Category']];
  for (let i = 0; i < categoryPluginNames.length; i += 1) {
    tableOptions.push([categoryPluginNames[i]]);
  }
  table(tableOptions, { format: 'markdown' });
}

module.exports = {
  listCategories,
};
