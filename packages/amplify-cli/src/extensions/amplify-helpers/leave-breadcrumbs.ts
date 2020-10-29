import * as path from 'path';

export function leaveBreadcrumbs(context, category, resourceName, breadcrumbs) {
  const destPath = path.join(
    context.amplify.pathManager.getBackendDirPath(),
    category,
    resourceName,
    context.amplify.constants.BreadcrumbsFileName,
  );
  context.amplify.writeObjectAsJson(destPath, breadcrumbs, true);
}
