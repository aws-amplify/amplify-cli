import path from 'path';

function readBreadcrumbs(context, category, resourceName) {
  const breadcrumbsPath = path.join(
    context.amplify.pathManager.getBackendDirPath(),
    category,
    resourceName,
    context.amplify.constants.BreadcrumbsFileName,
  );
  let breadcrumbs = context.amplify.readJsonFile(breadcrumbsPath, undefined, false);
  if (!breadcrumbs) {
    breadcrumbs = {
      pluginId: 'amplify-nodejs-function-runtime-provider',
      functionRuntime: 'nodejs',
      defaultEditorFile: 'src/index.js',
      useLegacyBuild: true,
    };
    context.amplify.leaveBreadcrumbs(context, category, resourceName, breadcrumbs);
  }
  return breadcrumbs;
}

module.exports = {
  readBreadcrumbs,
};
