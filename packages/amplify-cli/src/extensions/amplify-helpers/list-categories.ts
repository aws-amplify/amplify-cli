export function listCategories(context) {
  const categoryPluginNames = Object.keys(context.amplify.getAllCategoryPluginInfo(context));
  return categoryPluginNames.join(', ');
}
