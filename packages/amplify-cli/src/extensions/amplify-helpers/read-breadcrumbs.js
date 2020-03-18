import path from 'path';

function readBreadcrumbs(context, category, resourceName) {
  const breadcrumbsPath = path.join(
    context.amplify.pathManager.getBackendDirPath(),
    category,
    resourceName,
    context.amplify.constants.BreadcrumbsFileName,
  );
  return context.amplify.readJsonFile(breadcrumbsPath, undefined, false);
}

module.exports = {
  readBreadcrumbs,
};
